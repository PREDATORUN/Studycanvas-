import { describe, it, expect } from "vitest";
import {
  chooseQuality,
  displacementPixels,
  glassMaterial,
  opticalVector,
  springStep,
} from "../src/components/liquid-glass/material";

describe("clear glass optical field", () => {
  it("leaves the center neutral and bends opposite edges toward the center", () => {
    for (const component of opticalVector(150, 100, 300, 200, 30))
      expect(Math.abs(component)).toBe(0);
    const left = opticalVector(10, 100, 300, 200, 30);
    const right = opticalVector(290, 100, 300, 200, 30);
    expect(left[0]).toBeGreaterThan(8);
    expect(right[0]).toBeLessThan(-8);
    expect(left[0]).toBeCloseTo(-right[0]);
    expect(Math.abs(left[1])).toBe(0);
  });
  it("uses curved corner normals instead of uniformly shifting an image", () => {
    const corner = opticalVector(15, 15, 300, 200, 30);
    expect(corner[0]).toBeGreaterThan(3);
    expect(corner[1]).toBeGreaterThan(3);
    expect(Math.abs(opticalVector(150, 90, 300, 200, 30)[1])).toBeLessThan(0.2);
  });
  it("bounds displacement and pixels on large or very narrow surfaces", () => {
    for (const [w, h] of [
      [1500, 90],
      [40, 40],
      [5, 100],
      [900, 1200],
    ]) {
      const map = displacementPixels(w, h, 42);
      expect(map.width * map.height).toBeLessThan(
        glassMaterial.mapPixels + 1000,
      );
      expect(map.pixels.length).toBe(map.width * map.height * 4);
      for (let i = 3; i < map.pixels.length; i += 4)
        expect(map.pixels[i]).toBe(255);
    }
  });
  it("generates a localized ripple that returns exactly to the resting field", () => {
    const rest = opticalVector(50, 45, 160, 60, 16);
    expect(
      opticalVector(50, 45, 160, 60, 16, { x: 45, y: 30, age: 80 }),
    ).not.toEqual(rest);
    expect(
      opticalVector(50, 45, 160, 60, 16, { x: 45, y: 30, age: 800 }),
    ).toEqual(rest);
  });
});
describe("motion and quality", () => {
  it("settles a damped spring without persistent oscillation", () => {
    let value = 0,
      velocity = 0;
    for (let i = 0; i < 180; i++)
      ({ value, velocity } = springStep(value, velocity, 100, 1 / 60));
    expect(value).toBeCloseTo(100, 3);
    expect(Math.abs(velocity)).toBeLessThan(0.001);
    expect(springStep(0, 0, 100, 30)).toEqual(springStep(0, 0, 100, 1 / 30));
  });
  it("never enables unavailable optics and honors readability", () => {
    expect(chooseQuality("clear", false, false, false)).toBe("simple");
    expect(chooseQuality("auto", true, true, false)).toBe("simple");
    expect(chooseQuality("clear", true, true, false)).toBe("clear");
    expect(chooseQuality("clear", true, false, true)).toBe("solid");
    expect(chooseQuality("solid", true, false, false)).toBe("solid");
    expect(chooseQuality("auto", true, false, false)).toBe("clear");
  });
});
