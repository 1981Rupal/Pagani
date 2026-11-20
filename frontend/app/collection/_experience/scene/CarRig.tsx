"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CarComponent, ComponentId } from "../../_data/types";
import { actions, experienceStore, useExperience } from "../store";
import { createRig, stepRig, type Rig, type RigAnim } from "./rig";
import type { PartTree } from "./procedural/buildRoadster";

function componentFrom(obj: THREE.Object3D | null): ComponentId | null {
  for (let o = obj; o; o = o.parent) {
    if (o.userData.componentId) return o.userData.componentId as ComponentId;
  }
  return null;
}

export function CarRig({
  parts,
  components,
  rigRef,
  reducedMotion,
}: {
  parts: PartTree;
  components: CarComponent[];
  rigRef: React.RefObject<Rig | null>;
  reducedMotion: boolean;
}) {
  const rig = useMemo(() => createRig(parts, components), [parts, components]);
  const anim = useRef<RigAnim>({ explode: 0, view: "studio" });

  useEffect(() => {
    rigRef.current = rig;
    return () => {
      rigRef.current = null;
      // StrictMode re-mounts immediately with the same rig; only dispose if it's really gone.
      window.setTimeout(() => {
        if (rigRef.current !== rig) rig.dispose();
      }, 0);
    };
  }, [rig, rigRef]);

  // Per-frame work lives in rig.ts so the scene graph is mutated outside React's view.
  useFrame((_, dt) => {
    if (rigRef.current) stepRig(rigRef.current, experienceStore.get(), Math.min(dt, 0.05), reducedMotion, anim.current);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    actions.hover(componentFrom(e.object));
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    actions.hover(null);
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // that was a drag, not a click
    e.stopPropagation();
    const id = componentFrom(e.object);
    if (id) actions.select(experienceStore.get().selected === id ? null : id);
  };

  return (
    <group>
      <primitive object={rig.root} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
      <Markers rig={rig} components={components} anim={anim} />
    </group>
  );
}

/** Numbered hotspots that ride along with the exploded pieces. */
function Markers({
  rig,
  components,
  anim,
}: {
  rig: Rig;
  components: CarComponent[];
  anim: React.RefObject<RigAnim>;
}) {
  const selected = useExperience((s) => s.selected);
  const show = useExperience((s) => s.explode > 0.2 && s.view !== "blueprint");
  const refs = useRef(new Map<ComponentId, THREE.Group>());

  useFrame(() => {
    const t = anim.current.explode;
    refs.current.forEach((g, id) => {
      const c = rig.byId.get(id);
      if (!c) return;
      const vec = c.focus?.vec ?? c.pieces[0]?.vec;
      g.position.copy(c.anchorHome);
      if (vec) g.position.addScaledVector(vec, t);
    });
  });

  if (!show) return null;
  return (
    <>
      {components.map((c) => (
        <group
          key={c.id}
          ref={(g) => {
            if (g) refs.current.set(c.id, g);
            else refs.current.delete(c.id);
          }}
        >
          <Html center zIndexRange={[5, 0]} style={{ pointerEvents: "auto" }}>
            <button
              type="button"
              onClick={() => actions.select(c.id)}
              onPointerEnter={() => actions.hover(c.id)}
              onPointerLeave={() => actions.hover(null)}
              aria-label={`${c.index} ${c.name}`}
              aria-pressed={selected === c.id}
              className="group flex h-11 w-11 items-center justify-center"
            >
              {/* 44px hit area, 28px visual (Design.md §4 touch targets) */}
              <span
                className={`flex h-7 w-7 items-center justify-center border font-mono text-[11px] transition-colors duration-150 ${
                  selected === c.id
                    ? "border-accent bg-accent text-on-accent"
                    : "border-rule bg-panel text-fg group-hover:border-scienza-metal"
                }`}
              >
                {c.index}
              </span>
            </button>
          </Html>
        </group>
      ))}
    </>
  );
}
