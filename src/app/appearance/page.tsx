import { Shell } from "@/components/shell";
import {
  GlassPreferences,
  GlassPreview,
} from "@/components/liquid-glass/appearance";
import { LiquidGlassCard } from "@/components/liquid-glass/surface";

export default function AppearancePage() {
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR SPACE, REFINED</div>
          <h1>A clearer canvas.</h1>
          <p>Light, depth, and a little room to think.</p>
        </div>
      </div>
      <GlassPreview />
      <div className="learning-grid appearance-grid">
        <LiquidGlassCard>
          <h2>Comfort comes first.</h2>
          <GlassPreferences />
        </LiquidGlassCard>
        <LiquidGlassCard>
          <div className="eyebrow">CLEAR BY DESIGN</div>
          <h2>Focus stays on your work.</h2>
          <p>
            Curved edges bend the scene behind them. Your questions, notes, and
            controls stay sharp.
          </p>
          <p>
            Clear refraction is available in supported Chromium browsers. Other
            browsers use a simpler transparent material.
          </p>
          <p>
            Choose Solid whenever you prefer a quieter, higher-contrast canvas.
          </p>
        </LiquidGlassCard>
      </div>
    </Shell>
  );
}
