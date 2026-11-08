"use client";
import { useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useGlass } from "./renderer";
import type { GlassPreference } from "./material";

export function GlassPreferences() {
  const { preference, quality, setPreference } = useGlass();
  return (
    <>
      <label>
        Surface appearance
        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value as GlassPreference)}
        >
          <option value="auto">Automatic · adapt to this device</option>
          <option value="clear">Clear · optical edges where supported</option>
          <option value="simple">Simple · lighter on graphics</option>
          <option value="solid">Solid · maximum contrast</option>
        </select>
      </label>
      <p className="appearance-note" role="status">
        {quality === "clear"
          ? "Clear glass is selected. Keep Automatic on for adaptive performance."
          : quality === "solid"
            ? "Solid surfaces are active for extra readability."
            : "Simple glass is active. Every learning tool remains available."}
      </p>
      <small>
        Motion follows your device’s reduced-motion setting. Contrast
        preferences take priority.
      </small>
    </>
  );
}

export function AppearanceButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="icon-button"
        aria-label="Appearance settings"
        onClick={() => dialog.current?.showModal()}
      >
        <SlidersHorizontal size={18} />
      </button>
      <dialog
        ref={dialog}
        className="glass-dialog"
        aria-labelledby="appearance-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="row spread">
          <h2 id="appearance-title">Make it feel like you.</h2>
          <button
            className="icon-button"
            aria-label="Close appearance settings"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </button>
        </div>
        <GlassPreferences />
        <Link
          className="text-link"
          href="/appearance"
          onClick={() => dialog.current?.close()}
        >
          Explore clear glass ↗
        </Link>
      </dialog>
    </>
  );
}

export function GlassPreview() {
  const [position, setPosition] = useState(50);
  const [pattern, setPattern] = useState(true);
  return (
    <section className="glass-preview-section">
      <div className={`optics-stage ${pattern ? "with-grid" : ""}`}>
        <div className="optics-scene" aria-hidden="true">
          <span className="scene-ribbon ribbon-blue" />
          <span className="scene-ribbon ribbon-violet" />
          <span className="scene-orbit" />
          <span className="scene-line" />
          <span className="scene-word">Clarity.</span>
        </div>
        <div
          className="liquid-glass optics-lens"
          data-glass-priority="true"
          style={{
            left: `calc(12px + (100% - var(--lens-width) - 24px) * ${position / 100})`,
          }}
        >
          <span className="eyebrow">STUDYCANVAS</span>
          <strong>Clear thinking.</strong>
          <span>Space for your next breakthrough.</span>
        </div>
        <span className="optics-caption">
          Move the lens. Follow the lines at its edges.
        </span>
      </div>
      <div className="preview-controls">
        <label>
          Lens position
          <input
            aria-label="Lens position"
            type="range"
            min="0"
            max="100"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          />
        </label>
        <button
          className="button secondary"
          aria-pressed={pattern}
          onClick={() => setPattern(!pattern)}
        >
          {pattern ? "Hide" : "Show"} reference grid
        </button>
      </div>
    </section>
  );
}
