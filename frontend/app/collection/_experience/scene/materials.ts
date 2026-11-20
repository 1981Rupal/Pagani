import * as THREE from "three";
import { MAT } from "./palette";

/** 2×2 twill carbon weave drawn on a canvas. No image download needed. */
function carbonTexture(a: string, b: string) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const cell = size / 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      // Twill: the over/under pattern shifts by one each row.
      const over = (x + y) % 4 < 2;
      g.fillStyle = over ? a : b;
      g.fillRect(x * cell, y * cell, cell, cell);
      g.fillStyle = "rgba(255,255,255,0.05)";
      if (over) g.fillRect(x * cell, y * cell + cell * 0.15, cell, cell * 0.12);
      else g.fillRect(x * cell + cell * 0.15, y * cell, cell * 0.12, cell);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export type MaterialKit = ReturnType<typeof createMaterials>;

export function createMaterials() {
  const weave = carbonTexture(MAT.carbonB, MAT.carbonA);
  const tintedWeave = weave.clone();
  tintedWeave.needsUpdate = true;
  tintedWeave.repeat.set(2.5, 2.5);
  weave.repeat.set(4, 4);

  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: MAT.paintTint,
      map: tintedWeave,
      metalness: 0.35,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide,
    }),
    carbon: new THREE.MeshPhysicalMaterial({
      map: weave,
      metalness: 0.2,
      roughness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
    }),
    titanium: new THREE.MeshStandardMaterial({ color: MAT.titanium, metalness: 1, roughness: 0.32 }),
    aluminium: new THREE.MeshStandardMaterial({ color: MAT.aluminium, metalness: 1, roughness: 0.22 }),
    steel: new THREE.MeshStandardMaterial({ color: MAT.steel, metalness: 0.85, roughness: 0.45 }),
    engine: new THREE.MeshStandardMaterial({ color: MAT.engine, metalness: 0.7, roughness: 0.5 }),
    rubber: new THREE.MeshStandardMaterial({ color: MAT.rubber, metalness: 0, roughness: 0.92 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: MAT.glass,
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    leather: new THREE.MeshStandardMaterial({ color: MAT.leather, metalness: 0, roughness: 0.62 }),
    ceramic: new THREE.MeshStandardMaterial({ color: MAT.ceramic, metalness: 0.2, roughness: 0.65 }),
    caliper: new THREE.MeshStandardMaterial({ color: MAT.caliper, metalness: 0.6, roughness: 0.35 }),
    lamp: new THREE.MeshStandardMaterial({ color: MAT.lamp, emissive: MAT.lamp, emissiveIntensity: 0.12, metalness: 0.4, roughness: 0.15 }),
    dark: new THREE.MeshStandardMaterial({ color: MAT.carbonA, metalness: 0.3, roughness: 0.7, side: THREE.DoubleSide }),
    tail: new THREE.MeshStandardMaterial({ color: MAT.tail, emissive: MAT.tail, emissiveIntensity: 0.5, roughness: 0.3 }),
  };
}
