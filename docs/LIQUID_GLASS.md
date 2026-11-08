# Liquid Clear Glass — implementation and acceptance

This change adds a shared optical material to the existing StudyCanvas application. It is based on the clear panel in the supplied reference. It is **implemented and locally tested, but visual acceptance is pending**. An exact visual match, working compositor refraction on a particular device, and a sustained 60 FPS result have not been verified in this environment.

## Try it

Use the `work/liquid-clear-glass` branch. Run the existing `npm run dev -- --hostname 0.0.0.0` command and open port 3000. Open `/learning`, `/practice`, and `/appearance`. The sliders icon in the header opens appearance preferences without requiring an account. `/appearance` contains a movable lens over original colored vectors and a reference grid, using the same material as the rest of the app.

Surface appearance offers Automatic, Clear, Simple, and Solid. Automatic reduces quality on low-memory/low-core devices, with data saving enabled, or after measured slow interaction frames. OS high-contrast/reduced-transparency settings override Clear. Reduced motion disables pointer/tap motion and navigation springs. Preferences are local to this browser; blocked storage falls back to memory.

## Optical strategy

`material.ts` computes a rounded-rectangle signed distance and its outward normal. A convex perimeter profile displaces sampling inward, with a small central lens magnification. A short-lived radial wave is added at the pointer/touch location. The output is a bounded red/green displacement map, encoded with neutral channels near 0.5.

`renderer.tsx` creates SVG `feImage → feDisplacementMap` filters. Native `backdrop-filter: url(#filter)` is applied to the surface itself; it samples behind the surface without filtering the foreground labels, answers, fields or text. The `::before` layer supplies only tint, lighting and the visible ripple. `SourceGraphic` is the browser's live backdrop, not a screenshot or duplicated DOM tree. Moving/scrolling content is resampled by the compositor. No cross-origin pixels or student records are read into JavaScript; the canvas encodes only generated displacement vectors. Legacy `-webkit-backdrop-filter` declarations precede the standard spelling: reversing that order caused the CSS optimizer to drop the standard declaration and Chrome to compute `none`.

This is a practical optical approximation, not a physical fluid simulation or a reproduction of Apple's private renderer. Clear centers, curved edge displacement, directional rims, moving highlights and inset shadows provide depth. Spectral RGB separation is deliberately omitted for readability. Navigation uses a single spring-driven lens with bounded velocity-dependent stretching; separate droplet-fusion/bridge simulation is not implemented.

SVG backdrop filters are not consistently implemented across browser engines. We conservatively enable them only on eligible Chromium user agents, also checking CSS syntax support. A parse check cannot prove successful compositor output; `/appearance` and the pixel comparison acceptance test are the final check. Safari, iOS browser wrappers, Firefox and unsupported configurations get a two-pixel blur/transparent material. That fallback is **not represented as true refraction**. Native inputs/select popups retain browser rendering and stable contrast.

References:

- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- [MDN: feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap)
- [Browser compatibility tracking](https://github.com/mdn/browser-compat-data/issues/24110)

## Files and integration

| Module | Responsibility |
| --- | --- |
| `src/components/liquid-glass/material.ts` | Optical field, bounded map pixels, spring integration, quality policy |
| `renderer.tsx` | Shared observers, SVG filters, pointer events, adaptive quality, cleanup |
| `glass.css` | Light/dark material tokens, optical layers, responsive geometry, readable fallbacks |
| `surface.tsx` | Server-compatible `LiquidGlassSurface` and `LiquidGlassCard` |
| `navigation.tsx` | Spring motion and shape recovery for the active navigation lens |
| `appearance.tsx` | Preferences, native accessible dialog, movable reference scene |
| `environment.tsx` | Original vector environment actually painted behind the app |
| `src/app/appearance/page.tsx` | Public appearance and material inspection page |
| `layout.tsx`, `providers.tsx`, `shell.tsx`, `page.tsx` | App-wide integration and access to preferences |
| `tests/glass-*.test.*` | Optical math, quality policy, event preservation, resource search, cleanup |
| `tests/e2e/glass.spec.ts` | Real-browser pixel, motion, theme, scrolling and workflow checks |

Existing `.card`, `.button`, `.icon-button`, `.goal-banner`, header, sidebar and bottom-navigation surfaces are enhanced centrally. This covers dashboard, learning, practice, tests, resource search, social, planner, analytics, teacher/admin, notifications and auth screens without replacing their contents. Existing `Button`/Radix Slot composition and all business handlers are retained. Dense questions and account forms use a stronger contrast veil. New material primitives use the same runtime. No backend/API, authorization, data schema, learning-bank or Firebase rules files changed. No dependencies were added.

## Resource and performance limits

- One detached 2D canvas, one SVG definitions container, one resize observer, one visibility observer and delegated pointer listeners. No WebGL contexts.
- At most 16 visible refractive filters; navigation and floating controls are prioritized. Other surfaces keep the CSS material.
- At most 90,000 pixels per static map, 32 cached maps, and one new static map per animation frame. Offscreen filters are released.
- Tap maps are limited to 12,000 pixels, approximately 30 updates/second, 760 ms duration and surfaces under 160,000 CSS pixels. Large content panels use the lighting ripple only.
- No JS loop while stationary. No per-frame React state updates. Maps do not regenerate on scroll; the browser samples the live backdrop. Resize invalidates geometry. All listeners, observers, filters and RAF callbacks are cleaned up on unmount.
- Automatic quality drops to Simple when more than 30% of at least 40 sampled interaction frames exceed 27 ms. This measures delivered RAF intervals, not independent GPU time. Explicit Clear can remain expensive on weaker hardware; Solid is also available.

Local CPU-only measurement (40 map generations per shape; includes vector calculation/allocation, excludes PNG encoding, DOM, GPU and compositing):

| Surface | Median | p95 |
| --- | ---: | ---: |
| 1100 × 72 header | 6.60 ms | 8.89 ms |
| 218 × 860 sidebar | 6.99 ms | 8.38 ms |
| 420 × 260 card | 7.01 ms | 12.66 ms |
| 160 × 48 button | 0.65 ms | 0.75 ms |

These measurements are from the executor CPU, not an Android tablet. They do not establish a 60 FPS result. Compositor cost, battery use, device-specific fallback and scroll performance still need real-device profiling.

## Verification evidence

- TypeScript and ESLint pass.
- 64 Vitest tests pass: the previous 54 tests plus 10 optical/material/integration tests. DOM integration tests use JSDOM and mock graphics/observer APIs; they do not prove browser pixels.
- Production build passes with `/appearance` and all pre-existing routes.
- Source review confirms feature/backend logic is unchanged; existing scoring, authorization, social and learning API tests continue to pass.
- Browser visual checks/screenshots/recordings are **blocked**. The initial preview connection was refused. A stale generated Next.js cache also produced a build persistence error; regenerating `.next` fixed the build. The preview CLI subsequently reported a running service, but direct executor HTTP still failed, and automatic browser approval review denied navigation to the local preview origin. No alternate browser path was used to bypass that decision.
- Live Firebase workflows remain unverified without Firebase configuration, as already documented in `BUILD_READINESS.md`.

## Outstanding visual acceptance

Run `npm run test:e2e -- tests/e2e/glass.spec.ts` in a browser-enabled environment, then inspect screenshots and profile a real tablet. The suite is supplied but **not executed here**. It inherits desktop, tablet and mobile projects from `playwright.config.ts`.

| Test | Procedure | Current evidence |
| --- | --- | --- |
| A: refraction | Compare `/appearance` pixels with displacement enabled/disabled while holding tint/geometry fixed; inspect curved lines | Mathematical field tests pass; browser pixels pending |
| B: moving glass | Move the Lens position slider over stationary vectors | Implementation supplied; visual check pending |
| C: water interaction | Tap a glass button and inspect the decaying optical ripple; label must stay still | Action preservation tested in JSDOM; rendered ripple pending |
| D: navigation | Change Learning → Practice; inspect continuous indicator travel and settling | Spring convergence tested; browser motion pending |
| E: scrolling | Scroll Learning under the sticky header; inspect resampled content | Native backdrop strategy; browser verification pending |
| F: devices/themes | Check 390, 820 and 1440 px layouts, keyboard/dialog focus, both themes | Responsive CSS implemented; device and contrast audit pending |
| G: fallback | Select Simple/Solid; enable reduced motion/contrast; repeat actions | Policy, action preservation and zero-context fallback tests pass; browser checks pending |
| H: preservation | Practice submit, chapter/resource filtering, forms, navigation and authenticated workflows | Existing 54 tests pass plus resource/button integration checks; browser/Firebase end-to-end pending |

Do not mark visual acceptance complete or claim an exact reference match until these checks are observed.
