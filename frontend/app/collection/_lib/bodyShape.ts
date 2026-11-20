import type { BodyShape } from "../_data/types";

/**
 * Pure maths for a hypercar body surface. No three.js import, so the server
 * can use it too (catalogue silhouettes) and the client 3D loft shares the
 * exact same curves.
 *
 * Coordinates (metres): x forward (nose at +L/2), y up, z left.
 * s ∈ [0,1] runs nose → tail. θ runs around the cross-section.
 *
 * This is an *illustrative* body built from published dimensions, not CAD.
 * See ARCHITECTURE.md §5.
 */

type Curve = [s: number, v: number][];

/** Smooth (cosine-eased) interpolation through control points. */
function sample(curve: Curve, s: number): number {
  if (s <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [s1, v1] = curve[i];
    if (s <= s1) {
      const [s0, v0] = curve[i - 1];
      const t = (s - s0) / (s1 - s0);
      const e = (1 - Math.cos(Math.PI * t)) / 2;
      return v0 + (v1 - v0) * e;
    }
  }
  return curve[curve.length - 1][1];
}

/** Remap s for a longtail: stretch the rear third. */
function tailWarp(shape: BodyShape, s: number) {
  if (!shape.longtail) return s;
  const k = 1 + shape.longtail;
  // Rear 40% is stretched by k; the rest is compressed to compensate.
  const split = 0.6 / (0.6 + 0.4 * k);
  return s < split ? (s / split) * 0.6 : 0.6 + ((s - split) / (1 - split)) * 0.4;
}

// Centreline top (m). Open cockpit dips to the door line; closed adds a roof.
const TOP_OPEN: Curve = [
  [0, 0.42], [0.05, 0.56], [0.14, 0.66], [0.26, 0.74], [0.33, 0.8],
  [0.38, 0.8], [0.5, 0.8], [0.58, 0.9], [0.7, 0.96], [0.84, 0.95], [0.95, 0.86], [1, 0.74],
];
const TOP_CLOSED: Curve = [
  [0, 0.42], [0.05, 0.56], [0.14, 0.66], [0.26, 0.76], [0.32, 0.86],
  [0.4, 1.1], [0.47, 1.165], [0.56, 1.1], [0.66, 1.0], [0.8, 0.95], [0.95, 0.86], [1, 0.74],
];
const BOTTOM: Curve = [
  [0, 0.24], [0.06, 0.14], [0.15, 0.11], [0.8, 0.11], [0.9, 0.17], [1, 0.32],
];
// Half-width as a fraction of W/2.
const HALF_WIDTH: Curve = [
  [0, 0.62], [0.06, 0.86], [0.16, 0.97], [0.24, 0.98], [0.36, 0.9],
  [0.5, 0.92], [0.64, 0.98], [0.78, 1.0], [0.9, 0.93], [1, 0.74],
];

export function axleS(shape: BodyShape) {
  return {
    front: shape.frontOverhang / shape.length,
    rear: (shape.frontOverhang + shape.wheelbase) / shape.length,
  };
}

export function sToX(shape: BodyShape, s: number) {
  return shape.length / 2 - s * shape.length;
}

/** Fender height added above each wheel, peaking over the tyre's centreline. */
function fenderLift(shape: BodyShape, s: number) {
  const a = axleS(shape);
  const f = Math.exp(-(((s - a.front) / 0.085) ** 2)) * 0.2;
  const r = Math.exp(-(((s - a.rear) / 0.1) ** 2)) * 0.12;
  return f + r;
}

export type Station = { x: number; top: number; bottom: number; half: number; fender: number };

export function station(shape: BodyShape, sRaw: number): Station {
  const s = tailWarp(shape, sRaw);
  const top = sample(shape.roof === "open" ? TOP_OPEN : TOP_CLOSED, s);
  return {
    x: sToX(shape, sRaw),
    top,
    bottom: sample(BOTTOM, s),
    half: (sample(HALF_WIDTH, s) * shape.width) / 2,
    fender: fenderLift(shape, sRaw),
  };
}

const N = 3.2; // superellipse exponent: 2 = ellipse, higher = boxier

function spow(v: number, p: number) {
  return Math.sign(v) * Math.abs(v) ** p;
}

/**
 * Point on the body surface at (s, θ). θ = 0 is the left flank, π/2 the top
 * centreline, π the right flank, 3π/2 the floor.
 */
export function surfacePoint(shape: BodyShape, s: number, theta: number, inset = 0): [number, number, number] {
  const st = station(shape, s);
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  const half = st.half - inset;
  const hh = (st.top - st.bottom) / 2 - inset;
  const yc = (st.top + st.bottom) / 2;
  const z = half * spow(c, 2 / N);
  let y = yc + hh * spow(sn, 2 / N);
  if (sn > 0) {
    // Fenders rise over the wheels, outboard of the centreline.
    const zc = st.half * 0.78;
    const lateral = Math.exp(-(((Math.abs(z) - zc) / (st.half * 0.28)) ** 2));
    y += st.fender * lateral * Math.min(1, sn * 2.2);
  }
  return [st.x, y, z];
}

/** Highest point of the section (for the side silhouette). */
export function silhouetteTop(shape: BodyShape, s: number) {
  let best = -Infinity;
  for (let i = 0; i <= 24; i++) {
    const p = surfacePoint(shape, s, (Math.PI * i) / 24);
    if (p[1] > best) best = p[1];
  }
  return best;
}

/**
 * Side-view SVG path data for the catalogue silhouette. Units: metres scaled
 * by `k`, with y flipped so the ground sits at `groundY`.
 */
export function silhouettePaths(shape: BodyShape, k = 100, pad = 20) {
  const groundY = 1.3 * k + pad;
  const X = (x: number) => (shape.length / 2 - x) * k + pad;
  const Y = (y: number) => groundY - y * k;
  const steps = 120;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const st = station(shape, s);
    top.push(`${X(st.x).toFixed(1)},${Y(silhouetteTop(shape, s)).toFixed(1)}`);
    bottom.push(`${X(st.x).toFixed(1)},${Y(st.bottom).toFixed(1)}`);
  }
  const body = `M${top.join(" L")} L${bottom.reverse().join(" L")} Z`;

  const a = axleS(shape);
  const wheels = [
    { cx: X(sToX(shape, a.front)), r: shape.wheelRadius.front * k },
    { cx: X(sToX(shape, a.rear)), r: shape.wheelRadius.rear * k },
  ].map((w) => ({ ...w, cy: groundY - w.r }));

  // Windscreen line for open cars; the roof is already in the top curve when closed.
  const ws0 = 0.33;
  const p0 = station(shape, ws0);
  const screen =
    shape.roof === "open"
      ? `M${X(p0.x).toFixed(1)},${Y(p0.top).toFixed(1)} L${X(p0.x - 0.5).toFixed(1)},${Y(1.08).toFixed(1)}`
      : "";

  return {
    body,
    wheels,
    screen,
    groundY,
    width: shape.length * k + pad * 2,
    height: groundY + pad * 0.5,
  };
}
