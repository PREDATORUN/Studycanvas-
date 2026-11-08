/** Original vector scenery: the browser samples these actual painted curves. */
export function GlassEnvironment() {
  return (
    <div className="glass-environment" aria-hidden="true">
      <svg viewBox="0 0 1600 1200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="canvas-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#819be7" stopOpacity=".14" />
            <stop offset=".55" stopColor="#9782d6" stopOpacity=".26" />
            <stop offset="1" stopColor="#72b9cc" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <path
          d="M-200 1050 C80 370 180 310 670 490 S1390 850 1750 -150 L1750 40 C1390 1030 860 740 610 610 S100 410 -160 1220Z"
          fill="url(#canvas-ribbon)"
        />
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M-100 980 C200 250 200 380 680 510 S1400 810 1700 -100" />
          <path d="M-100 1000 C200 270 200 400 680 530 S1400 830 1700 -80" />
          <path d="M-100 1020 C200 290 200 420 680 550 S1400 850 1700 -60" />
          <ellipse
            cx="1370"
            cy="310"
            rx="370"
            ry="240"
            transform="rotate(-32 1370 310)"
          />
          <ellipse
            cx="1370"
            cy="310"
            rx="390"
            ry="260"
            transform="rotate(-32 1370 310)"
          />
        </g>
      </svg>
    </div>
  );
}
