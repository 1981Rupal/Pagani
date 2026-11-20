import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type V3 = [number, number, number];

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos?: V3, rot?: V3) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  return m;
}

export function rbox(w: number, h: number, d: number, mat: THREE.Material, pos?: V3, rot?: V3, radius = 0.02) {
  const r = Math.min(radius, w / 2.01, h / 2.01, d / 2.01);
  return mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, pos, rot);
}

const UP = new THREE.Vector3(0, 1, 0);

/** A cylinder from a to b: tubes, rods, arms. */
export function strut(a: V3, b: V3, r: number, mat: THREE.Material, radial = 10) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = mesh(new THREE.CylinderGeometry(r, r, len, radial, 1), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
  return m;
}

/** Smooth tube through points: pipes and linkages. */
export function tube(points: V3[], r: number, mat: THREE.Material, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, segments, r, 10, false), mat);
}

/** Helical coil spring between two points. */
export function spring(a: V3, b: V3, radius: number, wire: number, turns: number, mat: THREE.Material) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const pts = Array.from({ length: turns * 24 + 1 }, (_, i) => {
    const t = i / (turns * 24);
    const ang = t * turns * Math.PI * 2;
    return new THREE.Vector3(Math.cos(ang) * radius, t * len - len / 2, Math.sin(ang) * radius);
  });
  const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, wire, 6, false), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
  return m;
}

export function group(name: string, children: THREE.Object3D[] = [], pos?: V3) {
  const g = new THREE.Group();
  g.name = name;
  if (pos) g.position.set(...pos);
  children.forEach((c) => g.add(c));
  return g;
}
