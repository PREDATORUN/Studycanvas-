// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from "@testing-library/react";
import { LiquidGlassRenderer } from "../src/components/liquid-glass/renderer";
import { GlassPreferences } from "../src/components/liquid-glass/appearance";
import { Resources } from "../src/features/learning/resources";

vi.mock("../src/components/providers", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

const disconnect = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect = disconnect;
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect = disconnect;
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("CSS", { supports: () => false });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("shared material integration", () => {
  it("bounds live filters, stops when idle, and removes graphics on unmount", async () => {
    localStorage.setItem("studycanvas:glass-quality", "clear");
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Chrome/142.0");
    vi.stubGlobal("CSS", { supports: () => true });
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(180);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(50);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,stub",
    );
    vi.stubGlobal(
      "ImageData",
      class {
        constructor(
          public data: Uint8ClampedArray,
          public width: number,
          public height: number,
        ) {}
      },
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(
          private callback: (entries: { target: Element }[]) => void,
        ) {}
        observe(target: Element) {
          this.callback([{ target }]);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          private callback: (
            entries: { target: Element; isIntersecting: boolean }[],
          ) => void,
        ) {}
        observe(target: Element) {
          this.callback([{ target, isIntersecting: true }]);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    const { unmount } = render(
      <LiquidGlassRenderer>
        {Array.from({ length: 24 }, (_, i) => (
          <button className="button" key={i}>
            Action {i}
          </button>
        ))}
      </LiquidGlassRenderer>,
    );
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(document.documentElement.dataset.glassQuality).toBe("clear");
    expect(document.querySelectorAll("filter")).toHaveLength(16);
    const maps = document.documentElement.dataset.glassMaps;
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(document.documentElement.dataset.glassMaps).toBe(maps);
    expect(document.documentElement.dataset.glassAnimating).toBe("false");
    unmount();
    expect(document.querySelectorAll("filter")).toHaveLength(0);
  });
  it("keeps existing actions functional when graphics are unavailable", async () => {
    const action = vi.fn();
    render(
      <LiquidGlassRenderer>
        <button className="button" onClick={action}>
          Save my work
        </button>
      </LiquidGlassRenderer>,
    );
    await act(() => vi.advanceTimersByTimeAsync(80));
    const button = screen.getByText("Save my work");
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);
    expect(button.textContent).toBe("Save my work");
    expect(document.documentElement.dataset.glassQuality).toBe("simple");
  });
  it("preserves searchable resources under the global renderer", () => {
    render(
      <LiquidGlassRenderer>
        <Resources />
      </LiquidGlassRenderer>,
    );
    const all = screen.getAllByText("Download text guide").length;
    expect(all).toBeGreaterThan(1);
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "no-such-chapter-123" },
    });
    expect(screen.queryByText("Download text guide")).toBeNull();
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "" },
    });
    expect(screen.getAllByText("Download text guide")).toHaveLength(all);
  });
  it("saves an explicit solid preference and cleans up observers on unmount", async () => {
    const { unmount } = render(
      <LiquidGlassRenderer>
        <GlassPreferences />
      </LiquidGlassRenderer>,
    );
    fireEvent.change(screen.getByLabelText("Surface appearance"), {
      target: { value: "solid" },
    });
    expect(localStorage.getItem("studycanvas:glass-quality")).toBe("solid");
    expect(document.documentElement.dataset.glassQuality).toBe("solid");
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(document.documentElement.dataset.glassAnimating).toBe("false");
    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(document.querySelector(".glass-filter-definitions")).toBeNull();
  });
});
