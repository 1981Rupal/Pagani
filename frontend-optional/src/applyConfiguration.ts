import * as THREE from "three";
import { vehicleAssetMap, demoMaterials } from "./vehicleAssetMap";

type Config = {
  exterior?: Record<string, string>;
  wheels?: Record<string, string>;
  interior?: Record<string, string>;
};

function setMeshes(root: THREE.Object3D, names: readonly string[], color: string) {
  const hex = demoMaterials[color];
  if (!hex) return;
  root.traverse((obj) => {
    if (!obj.name || !names.includes(obj.name)) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if ("color" in material && (material as THREE.MeshStandardMaterial).color) {
        (material as THREE.MeshStandardMaterial).color.set(hex);
        material.needsUpdate = true;
      }
    });
  });
}

/** Apply validated backend configuration to a loaded GLTF scene. */
export function applyConfiguration(root: THREE.Object3D, config: Config) {
  const ext = config.exterior ?? {};
  const wheels = config.wheels ?? {};
  const interior = config.interior ?? {};

  if (ext.body_color)
    setMeshes(root, vehicleAssetMap.exterior.body_color, ext.body_color);
  if (wheels.finish)
    setMeshes(root, vehicleAssetMap.wheels.finish, wheels.finish);
  if (interior.seat_color)
    setMeshes(root, vehicleAssetMap.interior.seat_color, interior.seat_color);
  if (interior.stitching)
    setMeshes(root, vehicleAssetMap.interior.stitching, interior.stitching);
}
