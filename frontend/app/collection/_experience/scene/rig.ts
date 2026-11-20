import * as THREE from "three";
import type { CarComponent, ComponentId } from "../../_data/types";
import type { PartTree } from "./procedural/buildRoadster";
import { UI } from "./palette";
import type { ExperienceState } from "../store";
import { liveTelemetry } from "../audio/engineSynth";

const FADED = 0.1;
/** Bodywork when the x-ray view is on. */
const XRAY_SHELL: ComponentId[] = ["bodywork"];
const XRAY_OPACITY = 0.07;

/**
 * Turns a PartTree (procedural or glTF, same contract) into an animatable rig:
 * per-component material copies (so one part can fade while others stay solid),
 * a blueprint wireframe twin per component, explode vectors per piece, and a
 * marker anchor per component.
 */

export type Piece = { obj: THREE.Object3D; home: THREE.Vector3; vec: THREE.Vector3 };

export type ComponentRig = {
  id: ComponentId;
  group: THREE.Group;
  pieces: Piece[];
  meshes: THREE.Mesh[];
  solids: THREE.Material[];
  wire: THREE.MeshBasicMaterial;
  /** Current animated opacity multiplier. */
  opacity: number;
  hoverMix: number;
  /** Piece used for focus + marker (front-left for per-corner parts). */
  focus: Piece | null;
  anchorHome: THREE.Vector3;
};

export type Rig = {
  root: THREE.Group;
  byId: Map<ComponentId, ComponentRig>;
  vibrators: { obj: THREE.Object3D; base: THREE.Vector3 }[];
  spinners: THREE.Object3D[];
  flaps: THREE.Object3D[];
  dispose(): void;
};

type Base = { opacity: number; transparent: boolean; depthWrite: boolean; emissive?: THREE.Color; emissiveIntensity?: number };

export function createRig(parts: PartTree, components: CarComponent[]): Rig {
  const root = new THREE.Group();
  root.name = "car";
  const byId = new Map<ComponentId, ComponentRig>();
  const vibrators: Rig["vibrators"] = [];
  const spinners: THREE.Object3D[] = [];
  const flaps: THREE.Object3D[] = [];
  const disposables: { dispose(): void }[] = [];

  for (const comp of components) {
    // Clone so createRig stays pure: React may call it twice (StrictMode) with the
    // same PartTree, and re-parenting the originals would empty the first rig.
    const group = parts[comp.id]?.clone(true);
    if (!group) continue;
    group.userData.componentId = comp.id;
    root.add(group);

    const cache = new Map<THREE.Material, THREE.Material>();
    const wire = new THREE.MeshBasicMaterial({ color: UI.metal, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false });
    disposables.push(wire);
    const meshes: THREE.Mesh[] = [];

    group.traverse((o) => {
      if (o.userData.spin) spinners.push(o);
      if (o.userData.flap) flaps.push(o);
      if (o.userData.vibrate) vibrators.push({ obj: o, base: o.position.clone() });
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const src = m.material as THREE.Material;
      let copy = cache.get(src);
      if (!copy) {
        copy = src.clone();
        const std = copy as THREE.MeshStandardMaterial;
        copy.userData.base = {
          opacity: copy.opacity,
          transparent: copy.transparent,
          depthWrite: copy.depthWrite,
          emissive: std.emissive?.clone(),
          emissiveIntensity: std.emissiveIntensity,
        } satisfies Base;
        cache.set(src, copy);
        disposables.push(copy);
      }
      m.material = copy;
      m.userData.solid = copy;
      m.userData.componentId = comp.id;
      meshes.push(m);
      disposables.push(m.geometry);
    });

    const pieces: Piece[] = group.children.map((obj) => {
      const v = (obj.userData.explode as [number, number, number] | undefined) ?? comp.explode;
      const side = (obj.userData.side as number | undefined) ?? 1;
      return { obj, home: obj.position.clone(), vec: new THREE.Vector3(v[0], v[1], v[2] * side) };
    });
    // Per-corner parts (every piece has a side) focus on the front-left piece;
    // everything else frames the whole component.
    const perCorner = pieces.length > 1 && pieces.every((p) => p.obj.userData.side !== undefined);
    const focus = perCorner ? (pieces.find((p) => p.obj.userData.side === 1) ?? null) : null;
    const box = new THREE.Box3().setFromObject(focus?.obj ?? group);
    // An empty component (e.g. a glTF with no matching nodes) still gets a sane anchor.
    const anchorHome = box.isEmpty() ? new THREE.Vector3(0, 1, 0) : box.getCenter(new THREE.Vector3());
    if (!box.isEmpty()) anchorHome.y = Math.max(anchorHome.y, box.max.y * 0.6 + anchorHome.y * 0.4);

    byId.set(comp.id, {
      id: comp.id,
      group,
      pieces,
      meshes,
      solids: [...cache.values()],
      wire,
      opacity: 1,
      hoverMix: 0,
      focus,
      anchorHome,
    });
  }

  return {
    root,
    byId,
    vibrators,
    spinners,
    flaps,
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

const ACCENT = new THREE.Color(UI.accent);
const METAL = new THREE.Color(UI.metal);

/** Apply opacity + hover highlight to one component. Cheap enough to run per frame. */
export function applyLook(c: ComponentRig, blueprint: boolean, selected: boolean) {
  const o = c.opacity;
  if (blueprint) {
    c.wire.opacity = 0.08 + 0.5 * o;
    c.wire.color.copy(selected || c.hoverMix > 0.5 ? ACCENT : METAL);
    return;
  }
  for (const mat of c.solids) {
    const base = mat.userData.base as Base;
    const transparent = base.transparent || o < 0.999;
    if (mat.transparent !== transparent) {
      mat.transparent = transparent;
      mat.needsUpdate = true;
    }
    mat.opacity = base.opacity * o;
    mat.depthWrite = base.depthWrite && o > 0.6;
    const std = mat as THREE.MeshStandardMaterial;
    if (std.emissive && base.emissive) {
      std.emissive.copy(base.emissive).lerp(ACCENT, c.hoverMix * 0.35);
      std.emissiveIntensity = (base.emissiveIntensity ?? 1) * (1 - c.hoverMix) + 0.16 * c.hoverMix;
    }
  }
}

export function setBlueprint(c: ComponentRig, on: boolean) {
  for (const m of c.meshes) {
    m.material = on ? c.wire : (m.userData.solid as THREE.Material);
  }
}

/** Animation state carried between frames. */
export type RigAnim = { explode: number; view: string };

/** One frame: explode, fade, hover, blueprint swap, engine tremble, turbo spin, flaps. */
export function stepRig(rig: Rig, s: ExperienceState, dt: number, reducedMotion: boolean, anim: RigAnim) {
  const ease = (rate: number) => (reducedMotion ? 1 : Math.min(1, dt * rate));

  anim.explode += (s.explode - anim.explode) * ease(5);
  const t = anim.explode;

  const blueprint = s.view === "blueprint";
  if (anim.view !== s.view) {
    rig.byId.forEach((c) => setBlueprint(c, blueprint));
    anim.view = s.view;
  }

  rig.byId.forEach((c) => {
    for (const p of c.pieces) p.obj.position.copy(p.home).addScaledVector(p.vec, t);

    let target = 1;
    if (s.selected && s.selected !== c.id) target = FADED;
    else if (s.view === "xray" && XRAY_SHELL.includes(c.id) && s.selected !== c.id) target = XRAY_OPACITY;
    c.opacity += (target - c.opacity) * ease(8);
    c.hoverMix += ((s.hovered === c.id ? 1 : 0) - c.hoverMix) * Math.min(1, dt * 12);
    applyLook(c, blueprint, s.selected === c.id);
  });

  // The engine trembles with combustion; the turbos spin with boost.
  const rpm = liveTelemetry.rpm;
  const amp = rpm > 50 && !reducedMotion ? 0.0007 + liveTelemetry.throttle * 0.0016 : 0;
  for (const v of rig.vibrators) {
    v.obj.position.y += (Math.random() - 0.5) * amp;
    v.obj.position.z += (Math.random() - 0.5) * amp * 0.6;
  }
  for (const sp of rig.spinners) sp.rotation.x += dt * (rpm > 50 ? 6 + liveTelemetry.boost * 90 : 0);

  const flapTarget = s.flapsDeployed ? -0.42 : 0;
  for (const f of rig.flaps) f.rotation.z += (flapTarget - f.rotation.z) * ease(4);
}
