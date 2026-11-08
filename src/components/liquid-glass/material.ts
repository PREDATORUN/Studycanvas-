/** Shared optical and motion constants. All distances are CSS pixels. */
export const glassMaterial = {
  edge: 22,
  refraction: 26,
  magnification: 0.012,
  rippleAmplitude: 2.4,
  rippleDuration: 760,
  stiffness: 230,
  damping: 30,
  mapPixels: 90_000,
  maxSurfaces: 16,
  maxMapCache: 32,
  slowFrameMs: 27,
} as const;

export type GlassPreference = "auto" | "clear" | "simple" | "solid";
export type GlassQuality = "clear" | "simple" | "solid";
export type Ripple = { x: number; y: number; age: number };

export function chooseQuality(
  preference: GlassPreference,
  supported: boolean,
  lowPower: boolean,
  contrast: boolean,
): GlassQuality {
  if (contrast || preference === "solid") return "solid";
  if (preference === "simple" || !supported) return "simple";
  return preference === "auto" && lowPower ? "simple" : "clear";
}

export function springStep(
  value: number,
  velocity: number,
  target: number,
  dt: number,
) {
  // Semi-implicit Euler, bounded to avoid an unstable step after a suspended tab.
  dt = Math.min(1 / 30, Math.max(0, dt));
  velocity +=
    ((target - value) * glassMaterial.stiffness -
      velocity * glassMaterial.damping) *
    dt;
  return { value: value + velocity * dt, velocity };
}

/** Rounded-rectangle SDF gradient: a shape-aware normal, never random noise. */
export function opticalVector(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  ripple?: Ripple,
) {
  radius = Math.min(radius, width / 2, height / 2);
  const px = x - width / 2,
    py = y - height / 2;
  const qx = Math.abs(px) - (width / 2 - radius);
  const qy = Math.abs(py) - (height / 2 - radius);
  const ox = Math.max(qx, 0),
    oy = Math.max(qy, 0);
  const length = Math.hypot(ox, oy);
  const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
  let nx = 0,
    ny = 0;
  if (length > 0.001) {
    nx = (Math.sign(px) * ox) / length;
    ny = (Math.sign(py) * oy) / length;
  } else if (qx > qy) nx = Math.sign(px);
  else ny = Math.sign(py);
  const edge = Math.min(glassMaterial.edge, Math.min(width, height) * 0.3);
  const t = Math.max(0, Math.min(1, -distance / edge));
  // Convex bevel: flat center, steep optical transition near the perimeter.
  const bend =
    distance <= 0 ? Math.sin(Math.PI * t) * glassMaterial.refraction * 0.47 : 0;
  let dx = -nx * bend - px * glassMaterial.magnification;
  let dy = -ny * bend - py * glassMaterial.magnification;
  if (ripple && ripple.age < glassMaterial.rippleDuration) {
    const rx = x - ripple.x,
      ry = y - ripple.y;
    const d = Math.hypot(rx, ry),
      time = ripple.age / glassMaterial.rippleDuration;
    const front = time * Math.hypot(width, height) * 0.85;
    const ring = Math.exp(-Math.pow((d - front) / 14, 2));
    const wave =
      Math.sin((d - front) / 5) *
      ring *
      (1 - time) ** 2 *
      glassMaterial.rippleAmplitude;
    dx += (rx / Math.max(1, d)) * wave;
    dy += (ry / Math.max(1, d)) * wave;
  }
  const limit = glassMaterial.refraction / 2;
  return [
    Math.max(-limit, Math.min(limit, dx)),
    Math.max(-limit, Math.min(limit, dy)),
  ] as const;
}

export function displacementPixels(
  width: number,
  height: number,
  radius: number,
  budget = glassMaterial.mapPixels as number,
  ripple?: Ripple,
) {
  const ratio = Math.min(1, Math.sqrt(budget / Math.max(1, width * height)));
  const w = Math.max(2, Math.round(width * ratio)),
    h = Math.max(2, Math.round(height * ratio));
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [dx, dy] = opticalVector(
        ((x + 0.5) / w) * width,
        ((y + 0.5) / h) * height,
        width,
        height,
        radius,
        ripple,
      );
      const i = (y * w + x) * 4;
      pixels[i] = Math.round(255 * (0.5 + dx / glassMaterial.refraction));
      pixels[i + 1] = Math.round(255 * (0.5 + dy / glassMaterial.refraction));
      pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }
  return { width: w, height: h, pixels };
}
