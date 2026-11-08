"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  chooseQuality,
  displacementPixels,
  glassMaterial,
  springStep,
  type GlassPreference,
  type GlassQuality,
} from "./material";

const selector =
  ".liquid-glass, .card, .button, .icon-button, .topbar, .sidebar, .bottom-nav, .landing-nav, .goal-banner, .glass-indicator, .glass-dialog";
const ns = "http://www.w3.org/2000/svg";
const preferenceKey = "studycanvas:glass-quality";
let memoryPreference: GlassPreference = "auto";
function readPreference(): GlassPreference {
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved && ["auto", "clear", "simple", "solid"].includes(saved))
      return saved as GlassPreference;
    return "auto";
  } catch {
    /* Private browser storage is optional. */
  }
  return memoryPreference;
}
function subscribePreference(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("studycanvas-appearance", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("studycanvas-appearance", callback);
  };
}
const serverPreference = (): GlassPreference => "auto";
const GlassContext = createContext<{
  preference: GlassPreference;
  quality: GlassQuality;
  setPreference: (p: GlassPreference) => void;
}>({ preference: "auto", quality: "simple", setPreference: () => {} });
export const useGlass = () => useContext(GlassContext);

type Surface = {
  el: HTMLElement;
  id: string;
  visible: boolean;
  width: number;
  height: number;
  radius: number;
  filter?: SVGFilterElement;
  image?: SVGFEImageElement;
  displacement?: SVGFEDisplacementMapElement;
  base?: string;
  dirty: boolean;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  energy: number;
  ve: number;
  target: number;
  ripple?: { x: number; y: number; start: number };
  lastRipple: number;
};

/** One observer set, one event delegate, zero WebGL contexts and no idle animation loop. */
export function LiquidGlassRenderer({
  children,
}: {
  children: React.ReactNode;
}) {
  const defs = useRef<SVGDefsElement>(null);
  const preference = useSyncExternalStore(
    subscribePreference,
    readPreference,
    serverPreference,
  );
  const [quality, setQuality] = useState<GlassQuality>("simple");
  function setPreference(p: GlassPreference) {
    memoryPreference = p;
    try {
      localStorage.setItem(preferenceKey, p);
    } catch {
      /* Storage can be disabled. */
    }
    window.dispatchEvent(new Event("studycanvas-appearance"));
  }

  useEffect(() => {
    if (!defs.current) return;
    const root = document.documentElement,
      container = defs.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(prefers-contrast: more)");
    const transparency = matchMedia("(prefers-reduced-transparency: reduce)");
    const forced = matchMedia("(forced-colors: active)");
    // CSS.supports alone reports false positives in engines that parse url() but do not paint it.
    // Conservative eligibility: Chromium, excluding iOS's WebKit wrapper. Other engines use CSS glass.
    const supported =
      /Chrome|Chromium|Edg\//.test(navigator.userAgent) &&
      !/iPhone|iPad/.test(navigator.userAgent) &&
      CSS.supports("backdrop-filter", 'url("#glass-probe")');
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const lowPower =
      (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      navigator.hardwareConcurrency <= 4 ||
      !!device.connection?.saveData;
    let degraded = false;
    let current: GlassQuality = "simple";
    const surfaces = new Map<HTMLElement, Surface>();
    const cache = new Map<string, string>();
    const active = new Set<Surface>();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let frame = 0,
      last = 0,
      serial = 0,
      mapCount = 0,
      frames = 0,
      slowFrames = 0;
    let mapMs = 0;
    let disposed = false;

    function release(s: Surface) {
      s.el.style.removeProperty("--lg-filter");
      s.el.removeAttribute("data-refracting");
      s.filter?.remove();
      s.filter = undefined;
      s.image = undefined;
      s.displacement = undefined;
    }
    function wake() {
      if (!frame && !disposed && !document.hidden)
        frame = requestAnimationFrame(tick);
    }
    function updateQuality() {
      current = chooseQuality(
        preference,
        supported && !!context,
        lowPower || degraded,
        contrast.matches || transparency.matches || forced.matches,
      );
      root.dataset.glassQuality = current;
      root.dataset.glassSupport = supported ? "eligible" : "fallback";
      setQuality(current);
      for (const s of surfaces.values()) {
        release(s);
        s.dirty = true;
        s.ripple = undefined;
        s.target = 0;
        s.energy = 0;
        s.el.style.setProperty("--lg-ripple-alpha", "0");
        s.el.style.setProperty("--lg-press", "1");
      }
      active.clear();
      wake();
    }
    function imageMap(s: Surface, now?: number) {
      if (!context) return "";
      const key = `${s.width}:${s.height}:${s.radius}`;
      if (!now && cache.has(key)) return cache.get(key)!;
      const start = performance.now();
      const ripple =
        now && s.ripple
          ? { x: s.ripple.x, y: s.ripple.y, age: now - s.ripple.start }
          : undefined;
      const map = displacementPixels(
        s.width,
        s.height,
        s.radius,
        now ? 12_000 : glassMaterial.mapPixels,
        ripple,
      );
      canvas.width = map.width;
      canvas.height = map.height;
      context.putImageData(
        new ImageData(new Uint8ClampedArray(map.pixels), map.width, map.height),
        0,
        0,
      );
      const url = canvas.toDataURL("image/png");
      mapCount++;
      mapMs += performance.now() - start;
      if (!now) {
        if (cache.size >= glassMaterial.maxMapCache)
          cache.delete(cache.keys().next().value!);
        cache.set(key, url);
      }
      return url;
    }
    function prepare(s: Surface) {
      if (s.width < 2 || s.height < 2 || !context) return;
      s.base = imageMap(s);
      if (!s.filter) {
        s.filter = document.createElementNS(ns, "filter");
        s.filter.id = s.id;
        s.filter.setAttribute("filterUnits", "userSpaceOnUse");
        s.filter.setAttribute("primitiveUnits", "userSpaceOnUse");
        s.filter.setAttribute("color-interpolation-filters", "sRGB");
        s.image = document.createElementNS(ns, "feImage");
        s.image.setAttribute("result", "normalMap");
        s.image.setAttribute("preserveAspectRatio", "none");
        s.displacement = document.createElementNS(ns, "feDisplacementMap");
        s.displacement.setAttribute("in", "SourceGraphic");
        s.displacement.setAttribute("in2", "normalMap");
        s.displacement.setAttribute("xChannelSelector", "R");
        s.displacement.setAttribute("yChannelSelector", "G");
        s.displacement.setAttribute("scale", String(glassMaterial.refraction));
        s.filter.append(s.image, s.displacement);
        container.append(s.filter);
      }
      for (const el of [s.filter, s.image!]) {
        el.setAttribute("x", "0");
        el.setAttribute("y", "0");
        el.setAttribute("width", String(s.width));
        el.setAttribute("height", String(s.height));
      }
      s.image!.setAttribute("href", s.base);
      s.el.style.setProperty("--lg-filter", `url("#${s.id}")`);
      s.el.dataset.refracting = "true";
      s.dirty = false;
    }
    function tick(now: number) {
      frame = 0;
      const elapsed = last ? now - last : 16.67;
      const dt = Math.min(32, elapsed) / 1000;
      last = now;
      // Measure only consecutive interaction frames, not the gap between user actions.
      if (active.size && elapsed < 100) {
        frames++;
        if (elapsed > glassMaterial.slowFrameMs) slowFrames++;
        if (
          preference === "auto" &&
          current === "clear" &&
          frames >= 40 &&
          slowFrames / frames > 0.3
        ) {
          degraded = true;
          updateQuality();
        }
      }
      const visible = [...surfaces.values()]
        .filter((s) => s.visible && s.width > 1 && s.height > 1)
        .sort(
          (a, b) =>
            Number(
              b.el.matches(
                ".topbar,.bottom-nav,.glass-indicator,.glass-dialog,[data-glass-priority]",
              ),
            ) -
            Number(
              a.el.matches(
                ".topbar,.bottom-nav,.glass-indicator,.glass-dialog,[data-glass-priority]",
              ),
            ),
        );
      const selected = new Set(
        current === "clear" ? visible.slice(0, glassMaterial.maxSurfaces) : [],
      );
      let built = 0,
        pending = false;
      for (const s of surfaces.values()) {
        if (!selected.has(s)) {
          if (s.filter) release(s);
          continue;
        }
        if (!s.filter || s.dirty) {
          // One map per frame keeps mount/resize work under a modest CPU budget.
          if (built < 1) {
            prepare(s);
            built++;
          } else pending = true;
        }
      }
      for (const s of active) {
        if (!s.visible || reduced.matches) {
          s.ripple = undefined;
          active.delete(s);
          continue;
        }
        const x = springStep(s.x, s.vx, s.tx, dt),
          y = springStep(s.y, s.vy, s.ty, dt);
        const energy = springStep(s.energy, s.ve, s.target, dt);
        s.x = x.value;
        s.vx = x.velocity;
        s.y = y.value;
        s.vy = y.velocity;
        s.energy = energy.value;
        s.ve = energy.velocity;
        s.el.style.setProperty("--lg-x", `${s.x.toFixed(2)}%`);
        s.el.style.setProperty("--lg-y", `${s.y.toFixed(2)}%`);
        s.el.style.setProperty(
          "--lg-press",
          `${(1 - s.energy * 0.015).toFixed(4)}`,
        );
        s.displacement?.setAttribute(
          "scale",
          (glassMaterial.refraction * (1 + s.energy * 0.08)).toFixed(2),
        );
        if (s.ripple && now - s.ripple.start < glassMaterial.rippleDuration) {
          const age = now - s.ripple.start;
          s.el.style.setProperty("--lg-ripple-size", `${age * 0.55}px`);
          s.el.style.setProperty(
            "--lg-ripple-alpha",
            String((1 - age / glassMaterial.rippleDuration) * 0.3),
          );
          // Local, short-lived optical ripple. Static panels never rebuild on scroll.
          if (
            s.image &&
            !built &&
            now - s.lastRipple > 32 &&
            s.width * s.height < 160_000
          ) {
            s.image.setAttribute("href", imageMap(s, now));
            s.lastRipple = now;
          }
        } else if (s.ripple) {
          s.ripple = undefined;
          s.el.style.setProperty("--lg-ripple-alpha", "0");
          if (s.base) s.image?.setAttribute("href", s.base);
        }
        if (
          !s.ripple &&
          Math.abs(s.x - s.tx) +
            Math.abs(s.y - s.ty) +
            Math.abs(s.energy - s.target) +
            Math.abs(s.vx) +
            Math.abs(s.vy) +
            Math.abs(s.ve) <
            0.08
        )
          active.delete(s);
      }
      if (active.size || pending) wake();
      else last = 0;
      root.dataset.glassFilters = String(container.childElementCount);
      root.dataset.glassMaps = String(mapCount);
      root.dataset.glassMapMs = mapMs.toFixed(1);
      root.dataset.glassAnimating = active.size || pending ? "true" : "false";
    }
    const resize = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const s = surfaces.get(entry.target as HTMLElement);
        if (!s) continue;
        const w = Math.round(s.el.offsetWidth),
          h = Math.round(s.el.offsetHeight);
        const radius =
          parseFloat(getComputedStyle(s.el).borderTopLeftRadius) || 16;
        if (w !== s.width || h !== s.height || radius !== s.radius) {
          s.width = w;
          s.height = h;
          s.radius = radius;
          s.dirty = true;
        }
      }
      wake();
    });
    const intersection = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const s = surfaces.get(entry.target as HTMLElement);
        if (s) s.visible = entry.isIntersecting;
      }
      wake();
    });
    function discover(node: ParentNode) {
      const elements = [...node.querySelectorAll<HTMLElement>(selector)];
      if (node instanceof HTMLElement && node.matches(selector))
        elements.push(node);
      for (const el of elements) {
        if (surfaces.has(el)) continue;
        const s: Surface = {
          el,
          id: `sc-glass-${++serial}`,
          visible: false,
          width: 0,
          height: 0,
          radius: 16,
          dirty: true,
          x: 30,
          y: 10,
          tx: 30,
          ty: 10,
          vx: 0,
          vy: 0,
          energy: 0,
          ve: 0,
          target: 0,
          lastRipple: 0,
        };
        surfaces.set(el, s);
        el.dataset.lg = "";
        resize.observe(el);
        intersection.observe(el);
      }
    }
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (node instanceof HTMLElement) discover(node);
      for (const [el, s] of surfaces)
        if (!el.isConnected) {
          release(s);
          resize.unobserve(el);
          intersection.unobserve(el);
          surfaces.delete(el);
          active.delete(s);
        }
    });
    let hovered: Surface | undefined;
    function target(event: Event) {
      const el =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(selector)
          : null;
      return el ? surfaces.get(el) : undefined;
    }
    function move(event: PointerEvent) {
      if (reduced.matches || event.pointerType === "touch") return;
      const s = target(event);
      if (hovered && s !== hovered) {
        hovered.tx = 30;
        hovered.ty = 10;
        active.add(hovered);
      }
      hovered = s;
      if (s) {
        const rect = s.el.getBoundingClientRect();
        s.tx = ((event.clientX - rect.left) / rect.width) * 100;
        s.ty = ((event.clientY - rect.top) / rect.height) * 100;
        active.add(s);
      }
      if (active.size) wake();
    }
    function down(event: PointerEvent) {
      const s = target(event);
      if (
        !s ||
        reduced.matches ||
        s.el.matches(":disabled,[aria-disabled=true]")
      )
        return;
      const rect = s.el.getBoundingClientRect();
      s.ripple = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        start: performance.now(),
      };
      s.el.style.setProperty("--lg-tap-x", `${s.ripple.x}px`);
      s.el.style.setProperty("--lg-tap-y", `${s.ripple.y}px`);
      s.target = s.el.matches("button,a,[role=button]") ? 1 : 0;
      active.add(s);
      wake();
    }
    function up() {
      for (const s of active) s.target = 0;
      wake();
    }
    function leave(event: PointerEvent) {
      if (event.relatedTarget || !hovered) return;
      hovered.tx = 30;
      hovered.ty = 10;
      active.add(hovered);
      hovered = undefined;
      wake();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else wake();
    }
    discover(document);
    mutations.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", up, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    window.addEventListener("blur", up);
    document.addEventListener("visibilitychange", visibility);
    for (const media of [reduced, contrast, transparency, forced])
      media.addEventListener("change", updateQuality);
    updateQuality();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      intersection.disconnect();
      for (const s of surfaces.values()) {
        release(s);
        s.el.removeAttribute("data-lg");
      }
      for (const media of [reduced, contrast, transparency, forced])
        media.removeEventListener("change", updateQuality);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", up);
      document.removeEventListener("visibilitychange", visibility);
      cache.clear();
      active.clear();
      container.replaceChildren();
    };
  }, [preference]);

  return (
    <GlassContext.Provider value={{ preference, quality, setPreference }}>
      <svg
        className="glass-filter-definitions"
        aria-hidden="true"
        focusable="false"
      >
        <defs ref={defs} />
      </svg>
      {children}
    </GlassContext.Provider>
  );
}
