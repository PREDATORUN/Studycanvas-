"use client";
import { useEffect, useRef } from "react";
import { springStep } from "./material";

type Bounds = { x: number; y: number; width: number; height: number };
// In-memory only. Carries motion across App Router page shells, never stores user data.
const previous = new Map<string, Bounds>();

export function LiquidGlassNavigation({
  children,
  active,
  className = "",
  label,
}: {
  children: React.ReactNode;
  active: string;
  className?: string;
  label: string;
}) {
  const nav = useRef<HTMLElement>(null),
    lens = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nav.current,
      indicator = lens.current;
    if (!node || !indicator) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0,
      last = 0,
      current: Bounds | undefined = previous.get(label);
    const velocity = { x: 0, y: 0, width: 0, height: 0 };
    let target: Bounds;
    function paint() {
      if (!current || !indicator) return;
      const stretch = reduced.matches
        ? 0
        : Math.min(9, Math.hypot(velocity.x, velocity.y) * 0.012);
      const vertical = Math.abs(velocity.y) > Math.abs(velocity.x);
      indicator.style.left = `${current.x - (vertical ? 0 : stretch / 2)}px`;
      indicator.style.top = `${current.y - (vertical ? stretch / 2 : 0)}px`;
      indicator.style.width = `${current.width + (vertical ? 0 : stretch)}px`;
      indicator.style.height = `${current.height + (vertical ? stretch : 0)}px`;
      indicator.style.opacity = "1";
      previous.set(label, { ...current });
    }
    function frame(time: number) {
      if (!current) return;
      const dt = last ? (time - last) / 1000 : 1 / 60;
      last = time;
      let rest = true;
      for (const key of ["x", "y", "width", "height"] as const) {
        const next = springStep(current[key], velocity[key], target[key], dt);
        current[key] = next.value;
        velocity[key] = next.velocity;
        if (
          Math.abs(target[key] - current[key]) + Math.abs(velocity[key]) >
          0.2
        )
          rest = false;
      }
      paint();
      if (!rest) raf = requestAnimationFrame(frame);
      else {
        current = { ...target };
        paint();
        raf = 0;
      }
    }
    function measure() {
      const selected = node!.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      if (!selected || !node!.offsetWidth) {
        indicator!.style.opacity = "0";
        return;
      }
      target = {
        x: selected.offsetLeft,
        y: selected.offsetTop,
        width: selected.offsetWidth,
        height: selected.offsetHeight,
      };
      cancelAnimationFrame(raf);
      last = 0;
      if (!current || reduced.matches) {
        current = { ...target };
        paint();
      } else raf = requestAnimationFrame(frame);
    }
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    reduced.addEventListener("change", measure);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      reduced.removeEventListener("change", measure);
    };
  }, [active, label]);
  return (
    <nav
      ref={nav}
      className={`glass-navigation ${className}`}
      aria-label={label}
    >
      <span ref={lens} className="glass-indicator" aria-hidden="true" />
      {children}
    </nav>
  );
}
