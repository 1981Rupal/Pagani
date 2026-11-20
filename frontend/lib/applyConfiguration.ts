import * as THREE from "three";
import { vehicleAssetMap, demoMaterials } from "./vehicleAssetMap";

export type ConfigPayload = {
  exterior?: Record<string, string>;
  wheels?: Record<string, string>;
  interior?: Record<string, string>;
  bespoke?: Record<string, string>;
};

function setMeshes(
  root: THREE.Object3D,
  names: readonly string[],
  colorValue: string,
  options?: { roughness?: number; metalness?: number }
) {
  const hex = demoMaterials[colorValue] || colorValue;
  if (!hex) return;

  root.traverse((obj) => {
    if (!obj.name || !names.some((n) => obj.name.toLowerCase().includes(n.toLowerCase()))) {
      return;
    }
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((mat) => {
      if (mat && "color" in mat && (mat as THREE.MeshStandardMaterial).color) {
        const stdMat = mat as THREE.MeshStandardMaterial;
        stdMat.color.set(hex);
        if (options?.roughness !== undefined) stdMat.roughness = options.roughness;
        if (options?.metalness !== undefined) stdMat.metalness = options.metalness;
        stdMat.needsUpdate = true;
      }
    });
  });
}

/**
 * Apply validated configuration strictly to designated mesh targets.
 * Ensures modifying body paint does NOT affect wheels or interior components.
 */
export function applyConfiguration(root: THREE.Object3D, config: ConfigPayload) {
  if (!root) return;

  const ext = config.exterior ?? {};
  const wheels = config.wheels ?? {};
  const interior = config.interior ?? {};

  // Exterior Body
  if (ext.body_color) {
    setMeshes(root, vehicleAssetMap.exterior.body_color, ext.body_color, {
      metalness: 0.85,
      roughness: 0.25,
    });
  }

  // Carbon Finish
  if (ext.carbon_finish) {
    const roughness = ext.carbon_finish === "gloss_dark" ? 0.15 : ext.carbon_finish === "satin_dark" ? 0.5 : 0.35;
    setMeshes(root, vehicleAssetMap.exterior.carbon_finish, ext.carbon_finish, {
      metalness: 0.2,
      roughness,
    });
  }

  // Wheels
  if (wheels.finish) {
    const isGoldOrSilver = wheels.finish.includes("gold") || wheels.finish.includes("silver");
    setMeshes(root, vehicleAssetMap.wheels.finish, wheels.finish, {
      metalness: isGoldOrSilver ? 0.9 : 0.6,
      roughness: 0.25,
    });
  }

  // Interior Seats
  if (interior.seat_color) {
    setMeshes(root, vehicleAssetMap.interior.seat_color, interior.seat_color, {
      roughness: 0.8,
      metalness: 0.05,
    });
  }

  // Interior Stitching
  if (interior.stitching) {
    setMeshes(root, vehicleAssetMap.interior.stitching, interior.stitching, {
      roughness: 0.7,
      metalness: 0.1,
    });
  }
}

