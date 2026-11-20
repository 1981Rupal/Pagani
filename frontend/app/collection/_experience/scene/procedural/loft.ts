import * as THREE from "three";
import type { BodyShape } from "../../../_data/types";
import { axleS, sToX, station, surfacePoint } from "../../../_lib/bodyShape";

export type LoftOptions = {
  s0: number;
  s1: number;
  segS?: number;
  segT?: number;
  /** Shrinks the surface inward (m). Used for the inner monocoque tub. */
  inset?: number;
  /** Keep this quad? Receives the quad centre in world space. */
  keep?: (q: { s: number; theta: number; x: number; y: number; z: number }) => boolean;
  capStart?: boolean;
  capEnd?: boolean;
};

/**
 * Lofts the shared body surface between two stations into a BufferGeometry.
 * Quads are dropped via `keep` to cut wheel arches, the cockpit opening,
 * and to split panels (doors) from one continuous surface.
 */
export function loftGeometry(shape: BodyShape, o: LoftOptions) {
  const segS = o.segS ?? 90;
  const segT = o.segT ?? 72;
  const inset = o.inset ?? 0;
  const positions: number[] = [];
  const index: number[] = [];
  const cols = segT + 1;

  for (let i = 0; i <= segS; i++) {
    const s = o.s0 + ((o.s1 - o.s0) * i) / segS;
    for (let j = 0; j <= segT; j++) {
      const theta = (Math.PI * 2 * j) / segT;
      const [x, y, z] = surfacePoint(shape, s, theta, inset);
      positions.push(x, y, z);
    }
  }

  const P = (i: number, j: number) => {
    const k = (i * cols + j) * 3;
    return [positions[k], positions[k + 1], positions[k + 2]];
  };

  for (let i = 0; i < segS; i++) {
    for (let j = 0; j < segT; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + j + 1;
      const d = i * cols + j + 1;
      if (o.keep) {
        const pa = P(i, j);
        const pc = P(i + 1, j + 1);
        const q = {
          s: o.s0 + ((o.s1 - o.s0) * (i + 0.5)) / segS,
          theta: (Math.PI * 2 * (j + 0.5)) / segT,
          x: (pa[0] + pc[0]) / 2,
          y: (pa[1] + pc[1]) / 2,
          z: (pa[2] + pc[2]) / 2,
        };
        if (!o.keep(q)) continue;
      }
      // Winding so normals face outward (θ runs left → top → right).
      index.push(a, d, b, b, d, c);
    }
  }

  // Caps get their own copy of the rim vertices so the rim keeps a crisp edge.
  const addCap = (i: number, facingForward: boolean) => {
    const s = o.s0 + ((o.s1 - o.s0) * i) / segS;
    const st = station(shape, s);
    const centre = positions.length / 3;
    positions.push(st.x, (st.top + st.bottom) / 2, 0);
    const ring = positions.length / 3;
    for (let j = 0; j <= segT; j++) {
      const p = P(i, j);
      positions.push(p[0], p[1], p[2]);
    }
    for (let j = 0; j < segT; j++) {
      const a = ring + j;
      const b = ring + j + 1;
      if (facingForward) index.push(centre, b, a);
      else index.push(centre, a, b);
    }
  };
  if (o.capStart) addCap(0, true);
  if (o.capEnd) addCap(segS, false);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  // Planar UVs along the car, so the carbon weave reads at a sensible scale.
  const uv: number[] = [];
  for (let k = 0; k < positions.length; k += 3) uv.push(positions[k] * 2.2, (positions[k + 1] + positions[k + 2]) * 2.2);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Quad filter that cuts round arches around both axles. */
export function archCut(shape: BodyShape, clearance = 0.07) {
  const a = axleS(shape);
  const axles = [
    { x: sToX(shape, a.front), r: shape.wheelRadius.front },
    { x: sToX(shape, a.rear), r: shape.wheelRadius.rear },
  ];
  return (q: { x: number; y: number; z: number }) => {
    if (Math.abs(q.z) < 0.42) return true;
    for (const ax of axles) {
      const R = ax.r + clearance;
      if ((q.x - ax.x) ** 2 + (q.y - ax.r) ** 2 < R * R) return false;
    }
    return true;
  };
}
