import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PartTree } from "./buildRoadster";

/**
 * Draw-call reduction. The procedural car is ~350 small meshes; most of them
 * never move relative to their piece. For every piece, merge meshes that share
 * a material into one, so the GPU sees ~one draw per material per piece.
 *
 * Subtrees marked userData.spin / userData.flap animate on their own, so they
 * stay untouched.
 */
export function bakePieces(tree: PartTree) {
  for (const component of Object.values(tree)) {
    for (const piece of [...component.children]) bakePiece(piece);
  }
  return tree;
}

const KEEP = ["position", "normal", "uv"] as const;

function bakePiece(piece: THREE.Object3D) {
  piece.updateMatrixWorld(true);
  const toPiece = new THREE.Matrix4().copy(piece.matrixWorld).invert();
  const buckets = new Map<THREE.Material, { meshes: THREE.Mesh[]; geos: THREE.BufferGeometry[] }>();

  const visit = (o: THREE.Object3D) => {
    for (const child of [...o.children]) {
      if (child.userData.spin || child.userData.flap) continue;
      const m = child as THREE.Mesh;
      if (m.isMesh && !Array.isArray(m.material) && KEEP.every((k) => m.geometry.getAttribute(k))) {
        const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()) as THREE.BufferGeometry;
        for (const name of Object.keys(g.attributes)) if (!(KEEP as readonly string[]).includes(name)) g.deleteAttribute(name);
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toPiece, m.matrixWorld));
        const b = buckets.get(m.material) ?? { meshes: [], geos: [] };
        b.meshes.push(m);
        b.geos.push(g);
        buckets.set(m.material, b);
      }
      visit(child);
    }
  };
  visit(piece);

  buckets.forEach(({ meshes, geos }, material) => {
    const merged = meshes.length > 1 ? mergeGeometries(geos, false) : null;
    if (!merged) {
      geos.forEach((g) => g.dispose());
      return;
    }
    geos.forEach((g) => g.dispose());
    for (const m of meshes) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    const out = new THREE.Mesh(merged, material);
    out.name = `${piece.name}-baked`;
    piece.add(out);
  });
}
