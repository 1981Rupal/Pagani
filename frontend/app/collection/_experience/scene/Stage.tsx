"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, ContactShadows, Environment, Grid, Html, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { CameraPreset } from "../store";
import { actions, experienceStore, useExperience } from "../store";
import type { CarComponent, CatalogueModel, ModelSource } from "../../_data/types";
import { CATALOGUE } from "../../_data/catalogue";
import { CarRig } from "./CarRig";
import { buildGhost } from "./procedural/buildRoadster";
import { useGltfParts, useProceduralParts } from "./sources";
import { UI } from "./palette";
import type { Rig } from "./rig";

type Props = {
  model: CatalogueModel;
  components: CarComponent[];
  reducedMotion: boolean;
};

export default function Stage({ model, components, reducedMotion }: Props) {
  const rigRef = useRef<Rig | null>(null);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [14, 6, 14], fov: 34, near: 0.05, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={(e) => {
        if (e.type === "click") actions.select(null);
      }}
      aria-label={`Interactive 3D model of the ${model.name.join(" ")}`}
      role="img"
    >
      <color attach="background" args={[UI.page]} />
      <fog attach="fog" args={[UI.page, 16, 46]} />
      <Atelier />
      <Suspense fallback={<Html center className="font-mono text-[11px] tracking-label text-muted uppercase">Loading model…</Html>}>
        <Car source={model.source} model={model} components={components} rigRef={rigRef} reducedMotion={reducedMotion} />
      </Suspense>
      <Ghosts current={model.id} />
      <CameraDirector rigRef={rigRef} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

function Car({
  source,
  model,
  ...rest
}: { source: ModelSource; model: CatalogueModel } & Omit<React.ComponentProps<typeof CarRig>, "parts">) {
  return source.kind === "gltf" ? <GltfCar source={source} {...rest} /> : <ProceduralCar model={model} {...rest} />;
}

function ProceduralCar({ model, ...rest }: { model: CatalogueModel } & Omit<React.ComponentProps<typeof CarRig>, "parts">) {
  const parts = useProceduralParts(model.shape);
  return <CarRig parts={parts} {...rest} />;
}

function GltfCar({
  source,
  ...rest
}: { source: Extract<ModelSource, { kind: "gltf" }> } & Omit<React.ComponentProps<typeof CarRig>, "parts">) {
  const parts = useGltfParts(source);
  return <CarRig parts={parts} {...rest} />;
}

/** The world: a dark atelier floor that runs into fog, a turntable plinth, and soft studio light. */
function Atelier() {
  const columns = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return [Math.cos(a) * 21, Math.sin(a) * 21] as const;
      }),
    [],
  );
  return (
    <>
      <hemisphereLight args={[UI.text, UI.page, 0.35]} />
      {/* No shadow map: ContactShadows grounds the car at a fraction of the cost. */}
      <directionalLight position={[6, 9, 4]} intensity={1.6} />
      <directionalLight position={[-7, 4, -5]} intensity={0.5} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color={UI.text} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.1} color={UI.text} position={[0, 2, 7]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.1} color={UI.text} position={[0, 2, -7]} rotation={[0, Math.PI, 0]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={0.8} color={UI.accent} position={[-8, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} scale={[6, 1, 1]} />
        <Lightformer form="ring" intensity={1.4} color={UI.text} position={[8, 3, 2]} rotation={[0, -Math.PI / 2, 0]} scale={2} />
      </Environment>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[60, 96]} />
        <meshStandardMaterial color={UI.stage} roughness={0.85} metalness={0.1} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={UI.rule}
        sectionSize={4}
        sectionThickness={0.9}
        sectionColor={UI.rule}
        fadeDistance={38}
        fadeStrength={1.4}
      />
      {/* Turntable plinth */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.55, 3.6, 128]} />
        <meshBasicMaterial color={UI.accent} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} scale={7} blur={2.4} far={2} opacity={0.75} resolution={256} />

      {columns.map(([x, z], i) => (
        <mesh key={i} position={[x, 4, z]}>
          <boxGeometry args={[0.35, 8, 0.35]} />
          <meshStandardMaterial color={UI.panel} roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}

/** The other models stand in the world as wireframe placeholders. */
function Ghosts({ current }: { current: string }) {
  const focused = useExperience((s) => s.selected !== null);
  const others = useMemo(() => CATALOGUE.filter((m) => m.id !== current), [current]);
  // Either side of the default ¾ sightline, so they frame the car instead of hiding behind it.
  const spots: [number, number, number][] = [
    [11, 0, -10],
    [-10, 0, 11],
  ];
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: UI.metal, wireframe: true, transparent: true, opacity: 0.16 }), []);
  const ghosts = useMemo(() => others.map((m) => buildGhost(m.shape, mat)), [others, mat]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <>
      {others.map((m, i) => {
        const [x, y, z] = spots[i % spots.length];
        return (
          <group key={m.id} position={[x, y, z]} rotation={[0, i ? Math.PI * 0.25 : -Math.PI * 0.25, 0]}>
            <primitive object={ghosts[i]} />
            <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[3.05, 3.08, 96]} />
              <meshBasicMaterial color={UI.rule} />
            </mesh>
            {!focused && <Html position={[0, 2, 0]} center distanceFactor={14} zIndexRange={[4, 0]}>
              <a
                href={`/collection/${m.id}`}
                className="block min-w-44 border border-rule bg-panel px-4 py-3 text-center text-fg no-underline"
              >
                <span className="block font-mono text-[11px] uppercase tracking-label text-muted">In the atelier</span>
                <span className="mt-1 block font-display text-xl">
                  {m.name[0]} <em>{m.name[1]}</em>
                </span>
              </a>
            </Html>}
          </group>
        );
      })}
    </>
  );
}

const PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  "three-quarter": { pos: [4.8, 1.8, 4.6], target: [0, 0.5, 0] },
  side: { pos: [0, 1.0, 6.6], target: [0, 0.5, 0] },
  front: { pos: [6.8, 1.05, 0], target: [0, 0.5, 0] },
  rear: { pos: [-6.6, 1.4, 0], target: [0, 0.5, 0] },
  top: { pos: [0.01, 9.5, 0], target: [0, 0, 0] },
  cockpit: { pos: [-0.12, 1.06, 0.32], target: [1.8, 0.78, 0.32] },
};

const WALK_KEYS: Record<string, [number, number]> = {
  KeyW: [0, 1], ArrowUp: [0, 1],
  KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

function isTyping(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

/** Owns the camera: presets, focus on selection, and WASD walking. */
function CameraDirector({ rigRef, reducedMotion }: { rigRef: React.RefObject<Rig | null>; reducedMotion: boolean }) {
  const controls = useRef<CameraControls>(null);
  const camera = useExperience((s) => s.camera);
  const selected = useExperience((s) => s.selected);
  const size = useThree((s) => s.size);
  const keys = useRef(new Set<string>());
  const smooth = !reducedMotion;

  // Opening move: glide in from the far floor.
  useEffect(() => {
    const p = PRESETS["three-quarter"];
    controls.current?.setLookAt(...p.pos, ...p.target, smooth);
  }, [smooth]);

  useEffect(() => {
    if (camera.nonce === 0) return;
    const p = PRESETS[camera.preset];
    controls.current?.setFocalOffset(0, 0, 0, smooth);
    controls.current?.setLookAt(...p.pos, ...p.target, smooth);
  }, [camera, smooth]);

  useEffect(() => {
    const c = controls.current;
    const rig = rigRef.current;
    if (!c) return;
    if (!selected || !rig) {
      c.setFocalOffset(0, 0, 0, smooth);
      return;
    }
    // Wait for the explode animation to settle before framing.
    const id = window.setTimeout(() => {
      const comp = rig.byId.get(selected);
      if (!comp) return;
      const box = new THREE.Box3().setFromObject(comp.focus?.obj ?? comp.group);
      if (box.isEmpty()) return;
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = Math.max(sphere.radius, 0.45);
      // Keep the visitor's heading, but always look down on the part from ~35°.
      const pos = new THREE.Vector3();
      const tgt = new THREE.Vector3();
      c.getPosition(pos);
      c.getTarget(tgt);
      const dir = pos.sub(tgt).setY(0);
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 1);
      dir.normalize().multiplyScalar(Math.cos(0.6)).setY(Math.sin(0.6));
      const fov = THREE.MathUtils.degToRad((c.camera as THREE.PerspectiveCamera).fov ?? 34);
      const dist = (radius / Math.sin(fov / 2)) * 1.5;
      const eye = sphere.center.clone().addScaledVector(dir, dist);
      eye.y = Math.max(eye.y, 0.25);
      c.setLookAt(eye.x, eye.y, eye.z, sphere.center.x, sphere.center.y, sphere.center.z, smooth);
      // Keep the part clear of the story panel on wide screens.
      const wide = size.width >= 1024;
      // Shift right of the story panel (wide) and up, clear of the dock / bottom sheet.
      c.setFocalOffset(wide ? radius * 0.5 : 0, wide ? -radius * 0.3 : -radius * 0.6, 0, smooth);
    }, reducedMotion ? 0 : 280);
    return () => window.clearTimeout(id);
  }, [selected, rigRef, smooth, reducedMotion, size.width]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTyping(document.activeElement) || e.metaKey || e.ctrlKey) return;
      if (WALK_KEYS[e.code]) keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || keys.current.size === 0) return;
    let fwd = 0;
    let side = 0;
    keys.current.forEach((k) => {
      side += WALK_KEYS[k][0];
      fwd += WALK_KEYS[k][1];
    });
    const speed = 3.2 * dt; // metres per second, a slow walk
    if (side) c.truck(side * speed, 0, false);
    if (fwd) c.forward(fwd * speed, false);
    if (experienceStore.get().selected) actions.select(null);
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={0.4}
      maxDistance={26}
      maxPolarAngle={Math.PI / 2 - 0.04}
      smoothTime={0.6}
      draggingSmoothTime={0.12}
      dollyToCursor
    />
  );
}
