"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Float, Stage } from "@react-three/drei";
import * as THREE from "three";
import { demoMaterials, formatOptionLabel } from "@/lib/vehicleAssetMap";
import type { VehicleConfiguration } from "@/lib/atelierApi";

type Props = {
  configuration?: VehicleConfiguration | null;
  modelUrl?: string | null;
};

type CameraPreset = "quarter" | "side" | "front" | "cockpit";

/**
 * Procedural stylized Pagani aerodynamic silhouette representing Utopia proportions
 * Reacts dynamically to chosen body color, carbon finish, and wheel finish.
 */
function ProceduralUtopiaSilhouette({
  bodyColor,
  carbonColor,
  wheelColor,
  seatColor,
}: {
  bodyColor: string;
  carbonColor: string;
  wheelColor: string;
  seatColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Soft subtle turntable breathing
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const bodyHex = demoMaterials[bodyColor] || "#075E43";
  const carbonHex = demoMaterials[carbonColor] || "#1A1A1E";
  const wheelHex = demoMaterials[wheelColor] || "#B69A62";
  const seatHex = demoMaterials[seatColor] || "#A66F42";

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* Aerodynamic Lower Monocoque / Carbon Tub */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.35, 1.9]} />
        <meshStandardMaterial
          color={carbonHex}
          metalness={0.4}
          roughness={0.3}
          wireframeLinewidth={1}
        />
      </mesh>

      {/* Main Sculpted Body Paint */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.3, 1.8]} />
        <meshStandardMaterial
          color={bodyHex}
          metalness={0.88}
          roughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Aerodynamic Front Splitter & Hood Slope */}
      <mesh position={[1.65, 0.42, 0]} rotation={[0, 0, -0.22]} castShadow>
        <boxGeometry args={[1.2, 0.18, 1.7]} />
        <meshStandardMaterial color={bodyHex} metalness={0.88} roughness={0.18} />
      </mesh>

      {/* Front Carbon Diffuser & Canards */}
      <mesh position={[2.1, 0.22, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 1.9]} />
        <meshStandardMaterial color={carbonHex} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Greenhouse / Teardrop Glass Cockpit */}
      <mesh position={[-0.1, 0.88, 0]} castShadow>
        <sphereGeometry args={[1.0, 32, 16]} />
        <meshPhysicalMaterial
          color="#15171C"
          metalness={0.2}
          roughness={0.1}
          transmission={0.65}
          thickness={0.5}
        />
      </mesh>

      {/* Visible Interior Bucket Seats */}
      <mesh position={[-0.1, 0.72, 0.32]} castShadow>
        <boxGeometry args={[0.45, 0.55, 0.45]} />
        <meshStandardMaterial color={seatHex} roughness={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.72, -0.32]} castShadow>
        <boxGeometry args={[0.45, 0.55, 0.45]} />
        <meshStandardMaterial color={seatHex} roughness={0.8} />
      </mesh>

      {/* Rear Engine Cover & Central Exhaust Array */}
      <mesh position={[-1.4, 0.65, 0]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[1.5, 0.28, 1.65]} />
        <meshStandardMaterial color={bodyHex} metalness={0.88} roughness={0.18} />
      </mesh>
      {/* Quad Exhaust Housing (Pagani Trademark Signature) */}
      <mesh position={[-2.1, 0.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.16, 0.04, 16, 32]} />
        <meshStandardMaterial color="#D1D5DB" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Rear Active Aero Wings */}
      <mesh position={[-1.9, 0.88, 0.6]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        <meshStandardMaterial color={carbonHex} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-1.9, 0.88, -0.6]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        <meshStandardMaterial color={carbonHex} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Four Precision Forged Wheels */}
      {[
        { pos: [1.35, 0.35, 0.95] as [number, number, number] },
        { pos: [1.35, 0.35, -0.95] as [number, number, number] },
        { pos: [-1.35, 0.38, 0.98] as [number, number, number] },
        { pos: [-1.35, 0.38, -0.98] as [number, number, number] },
      ].map((w, idx) => (
        <group key={idx} position={w.pos}>
          {/* Outer Tire */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.3, 32]} />
            <meshStandardMaterial color="#111215" roughness={0.9} />
          </mesh>
          {/* Wheel Rim / Spokes with Chosen Finish */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.32, 16]} />
            <meshStandardMaterial color={wheelHex} metalness={0.92} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Illuminated Studio Plinth / Circular Turntable */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.4, 0.08, 64]} />
        <meshStandardMaterial color="#15171C" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Gold Rim on Plinth */}
      <mesh position={[0, 0.025, 0]}>
        <ringGeometry args={[3.15, 3.22, 64]} />
        <meshBasicMaterial color="#C5A059" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Viewer3D({ configuration }: Props) {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("quarter");
  const controlsRef = useRef<any>(null);

  const bodyColor = configuration?.exterior?.body_color || "emerald_green";
  const carbonColor = configuration?.exterior?.carbon_finish || "exposed_dark";
  const wheelColor = configuration?.wheels?.finish || "champagne_gold";
  const seatColor = configuration?.interior?.seat_color || "tan";

  const handlePreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!controlsRef.current) return;

    if (preset === "quarter") {
      controlsRef.current.object.position.set(4.5, 2.5, 4.5);
      controlsRef.current.target.set(0, 0.5, 0);
    } else if (preset === "side") {
      controlsRef.current.object.position.set(0, 1.2, 5.5);
      controlsRef.current.target.set(0, 0.5, 0);
    } else if (preset === "front") {
      controlsRef.current.object.position.set(5.5, 1.2, 0);
      controlsRef.current.target.set(0, 0.5, 0);
    } else if (preset === "cockpit") {
      controlsRef.current.object.position.set(0.6, 1.8, 1.2);
      controlsRef.current.target.set(0, 0.6, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full min-h-[420px] lg:min-h-[580px] bg-gradient-to-b from-[#0F1015] via-[#0B0C0E] to-[#08090B] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
      {/* 3D Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border border-white/30"
            style={{ backgroundColor: demoMaterials[bodyColor] || "#075E43" }}
          />
          <span className="text-xs text-zinc-200 font-medium tracking-wide">
            {formatOptionLabel(bodyColor)}
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-xs text-[#C5A059] font-medium tracking-wide">
            {formatOptionLabel(wheelColor)} Wheels
          </span>
        </div>

        {/* Camera Preset Toolbar */}
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 flex gap-1 text-[11px]">
          {(
            [
              ["quarter", "Quarter 3/4"],
              ["side", "Side Profile"],
              ["front", "Front Aero"],
              ["cockpit", "Cockpit Focus"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePreset(key)}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === key
                  ? "bg-[#C5A059] text-black font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* WebGL Canvas */}
      <div className="w-full flex-1 relative">
        <Canvas
          camera={{ position: [4.5, 2.5, 4.5], fov: 42 }}
          shadows
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={["#0B0C0E"]} />
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[8, 12, 6]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-8, 6, -6]} intensity={0.8} color="#93C5FD" />
          <pointLight position={[0, 4, 0]} intensity={1.2} color="#FFFFFF" />

          <ProceduralUtopiaSilhouette
            bodyColor={bodyColor}
            carbonColor={carbonColor}
            wheelColor={wheelColor}
            seatColor={seatColor}
          />

          <ContactShadows
            position={[0, -0.05, 0]}
            opacity={0.75}
            scale={10}
            blur={1.8}
            far={4}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={2.5}
            maxDistance={9.0}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>
      </div>

      {/* Transparent Disclaimer Footer Overlay */}
      <div className="p-3 bg-black/70 backdrop-blur-md border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          <span>Interactive 3D Studio Preview &bull; Rotate &amp; zoom enabled</span>
        </div>
        <div className="text-[10px] text-zinc-400 italic text-center sm:text-right">
          Procedural Studio Placeholder &mdash; Official licensed Pagani CAD/GLB required for manufacturing mesh rendering.
        </div>
      </div>
    </div>
  );
}

