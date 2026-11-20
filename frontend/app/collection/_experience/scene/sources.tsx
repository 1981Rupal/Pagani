"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { BodyShape, ComponentId, ModelSource } from "../../_data/types";
import { createMaterials } from "./materials";
import { buildRoadster, type PartTree } from "./procedural/buildRoadster";

/**
 * Model sources → PartTree. Both paths produce the same contract, so the rig,
 * markers, explode view and story panel don't care where the meshes came from.
 * See ARCHITECTURE.md §5.
 */

const ALL: ComponentId[] = [
  "monocoque", "subframes", "bodywork", "engine", "turbos", "gearbox",
  "exhaust", "suspension", "brakes", "wheels", "aero", "cockpit",
];

export function useProceduralParts(shape: BodyShape): PartTree {
  return useMemo(() => buildRoadster(shape, createMaterials()), [shape]);
}

/**
 * glTF path. Each mesh is assigned to the first component whose patterns match
 * its own name or an ancestor's name. Unmatched meshes fall back to "bodywork".
 * One piece per component, so explode vectors apply to the whole component.
 */
export function useGltfParts(source: Extract<ModelSource, { kind: "gltf" }>): PartTree {
  const gltf = useGLTF(source.url);
  return useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.scale.setScalar(source.scale ?? 1);
    scene.rotation.y = source.rotationY ?? 0;
    scene.updateMatrixWorld(true);

    const patterns = ALL.map((id) => ({
      id,
      res: (source.partMap[id] ?? []).map((p) => new RegExp(p, "i")),
    }));
    const match = (o: THREE.Object3D): ComponentId => {
      for (let n: THREE.Object3D | null = o; n; n = n.parent) {
        for (const { id, res } of patterns) if (res.some((r) => r.test(n!.name))) return id;
      }
      return "bodywork";
    };

    const tree = Object.fromEntries(
      ALL.map((id) => {
        const g = new THREE.Group();
        g.name = id;
        const piece = new THREE.Group();
        piece.name = `${id}-piece`;
        g.add(piece);
        return [id, g];
      }),
    ) as PartTree;

    const meshes: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const m of meshes) {
      const id = match(m);
      const world = m.matrixWorld.clone();
      const clone = m.clone();
      clone.matrixAutoUpdate = true;
      world.decompose(clone.position, clone.quaternion, clone.scale);
      tree[id].children[0].add(clone);
    }
    return tree;
  }, [gltf, source]);
}
