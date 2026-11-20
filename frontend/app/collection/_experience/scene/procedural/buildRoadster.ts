import * as THREE from "three";
import type { BodyShape, ComponentId } from "../../../_data/types";
import { axleS, sToX, station } from "../../../_lib/bodyShape";
import type { MaterialKit } from "../materials";
import { archCut, loftGeometry } from "./loft";
import { bakePieces } from "./bake";
import { group, mesh, rbox, spring, strut, tube, type V3 } from "./helpers";

/**
 * Procedural Utopia Roadster, built to the published dimensions
 * (4,673 × 2,060 mm, 2,796 mm wheelbase, 265/35 R21 · 325/30 R22).
 *
 * Output contract (shared with the glTF loader, see ARCHITECTURE.md §5):
 *   one THREE.Group per ComponentId; each direct child is a "piece".
 *   piece.userData.side    = ±1  → mirror the explode vector's z for that side
 *   piece.userData.explode = V3  → override the component's explode vector
 *   object.userData.spin   = "x" → spun by turbo boost each frame
 *   object.userData.flap   = true → rotated by the aero flap state
 *
 * Geometry is illustrative: proportions and part placement are faithful,
 * internal dimensions are not engineering data.
 */

export type PartTree = Record<ComponentId, THREE.Group>;

export function buildRoadster(shape: BodyShape, M: MaterialKit): PartTree {
  const a = axleS(shape);
  const XF = sToX(shape, a.front);
  const XR = sToX(shape, a.rear);
  const RF = shape.wheelRadius.front;
  const RR = shape.wheelRadius.rear;
  const corners = [
    { x: XF, r: RF, z: 0.85, w: 0.265, rim: RF - 0.0928, disc: 0.205, pistons: 6 },
    { x: XR, r: RR, z: 0.82, w: 0.325, rim: RR - 0.0975, disc: 0.195, pistons: 4 },
  ];
  const sides = [1, -1] as const;

  // ---------------------------------------------------------------- bodywork
  const arches = archCut(shape);
  const COCKPIT: [number, number] = [0.335, 0.56];

  const nose = group("nose", [
    mesh(loftGeometry(shape, { s0: 0, s1: COCKPIT[0], segS: 70, keep: arches, capStart: true }), M.paint),
    ...sides.map((sd) => {
      const m = mesh(new THREE.SphereGeometry(1, 24, 12), M.lamp, [2.02, 0.52, 0.6 * sd]);
      m.scale.set(0.15, 0.045, 0.11);
      return m;
    }),
  ]);
  nose.userData.explode = [0.75, 0.55, 0] satisfies V3;

  const doors = sides.map((sd) => {
    const g = group(`door-${sd > 0 ? "L" : "R"}`, [
      mesh(
        loftGeometry(shape, {
          s0: COCKPIT[0],
          s1: COCKPIT[1],
          segS: 40,
          keep: (q) => q.y > 0.26 && q.z * sd > 0 && Math.abs(q.z) > station(shape, q.s).half * 0.8,
        }),
        M.paint,
      ),
    ]);
    g.userData.side = sd;
    g.userData.explode = [0, 0.08, 0.8] satisfies V3;
    return g;
  });

  const rear = group("rear-clamshell", [
    mesh(loftGeometry(shape, { s0: COCKPIT[1], s1: 1, segS: 100, keep: arches, capEnd: true }), M.paint),
    // Speedster fairings flowing from the headrests into the deck
    ...sides.map((sd) => {
      const m = mesh(new THREE.SphereGeometry(1, 28, 14), M.paint, [-0.55, 0.86, 0.33 * sd]);
      m.scale.set(0.62, 0.15, 0.19);
      return m;
    }),
    // Side intakes
    ...sides.map((sd) => {
      const m = mesh(new THREE.SphereGeometry(1, 24, 12), M.dark, [-0.42, 0.56, 0.955 * sd]);
      m.scale.set(0.36, 0.11, 0.05);
      return m;
    }),
    // Round tail lamps, two per side
    ...sides.flatMap((sd) =>
      [0.42, 0.6].map((z) =>
        mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.03, 24), M.tail, [-2.33, 0.6, z * sd], [0, 0, Math.PI / 2]),
      ),
    ),
  ]);
  rear.userData.explode = [-0.8, 0.65, 0] satisfies V3;

  // Windscreen: a curved glass band rising from the cowl
  const ws = station(shape, COCKPIT[0]);
  const screenGeo = new THREE.PlaneGeometry(1, 1, 24, 8);
  const pos = screenGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) * 2; // -1..1 across
    const v = pos.getY(i) + 0.5; // 0..1 up
    const half = THREE.MathUtils.lerp(ws.half * 0.8, 0.6, v);
    pos.setXYZ(i, ws.x - v * 0.48 - 0.1 * u * u, ws.top + v * 0.27 - 0.035 * u * u, u * half);
  }
  screenGeo.computeVertexNormals();
  const screen = group("windscreen", [
    mesh(screenGeo, M.glass),
    tube(
      Array.from({ length: 13 }, (_, i): V3 => {
        const u = (i / 12) * 2 - 1;
        return [ws.x - 0.48 - 0.1 * u * u, ws.top + 0.27 - 0.035 * u * u, u * 0.6];
      }),
      0.012,
      M.carbon,
    ),
  ]);
  screen.userData.explode = [0.3, 0.95, 0] satisfies V3;

  const bodywork = group("bodywork", [nose, ...doors, rear, screen]);

  // ---------------------------------------------------------------- monocoque
  const monocoque = group("monocoque", [
    group("tub", [
      mesh(
        loftGeometry(shape, {
          s0: 0.3,
          s1: 0.6,
          segS: 50,
          inset: 0.07,
          keep: (q) => Math.sin(q.theta) < 0.3,
        }),
        M.carbon,
      ),
      rbox(0.04, 0.5, 1.5, M.carbon, [0.86, 0.42, 0]),
      rbox(0.04, 0.6, 1.62, M.carbon, [-0.42, 0.46, 0]),
      rbox(1.05, 0.16, 0.22, M.carbon, [0.25, 0.2, 0]),
    ]),
  ]);

  // ---------------------------------------------------------------- subframes
  const frame = (nodes: { x: number; z: number; y0: number; y1: number }[], name: string, explode: V3) => {
    const parts: THREE.Object3D[] = [];
    const R = 0.016;
    nodes.forEach((n, i) => {
      for (const sd of sides) parts.push(strut([n.x, n.y0, n.z * sd], [n.x, n.y1, n.z * sd], R, M.steel));
      parts.push(strut([n.x, n.y0, n.z], [n.x, n.y0, -n.z], R, M.steel));
      parts.push(strut([n.x, n.y1, n.z], [n.x, n.y1, -n.z], R, M.steel));
      const p = nodes[i - 1];
      if (!p) return;
      for (const sd of sides) {
        parts.push(strut([p.x, p.y0, p.z * sd], [n.x, n.y0, n.z * sd], R, M.steel));
        parts.push(strut([p.x, p.y1, p.z * sd], [n.x, n.y1, n.z * sd], R, M.steel));
        parts.push(strut([p.x, p.y0, p.z * sd], [n.x, n.y1, n.z * sd], R * 0.8, M.steel)); // triangulation
      }
    });
    const g = group(name, parts);
    g.userData.explode = explode;
    return g;
  };
  const subframes = group("subframes", [
    frame(
      [
        { x: 0.86, z: 0.36, y0: 0.18, y1: 0.6 },
        { x: 1.4, z: 0.34, y0: 0.17, y1: 0.58 },
        { x: 1.95, z: 0.28, y0: 0.2, y1: 0.48 },
      ],
      "front-subframe",
      [0.55, -0.35, 0],
    ),
    frame(
      [
        { x: -0.42, z: 0.46, y0: 0.16, y1: 0.68 },
        { x: -1.25, z: 0.46, y0: 0.16, y1: 0.7 },
        { x: -2.02, z: 0.4, y0: 0.2, y1: 0.62 },
      ],
      "rear-subframe",
      [-0.55, -0.35, 0],
    ),
  ]);

  // ---------------------------------------------------------------- engine
  const bank = (sd: number) => {
    const b = group(`bank-${sd}`, [
      rbox(0.76, 0.26, 0.2, M.engine, [0, 0.22, 0]),
      rbox(0.8, 0.09, 0.25, M.aluminium, [0, 0.39, 0]),
      rbox(0.76, 0.05, 0.21, M.carbon, [0, 0.455, 0], undefined, 0.02),
      ...Array.from({ length: 6 }, (_, i) =>
        mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 10), M.engine, [-0.31 + i * 0.124, 0.495, 0.02]),
      ),
    ]);
    b.rotation.x = (Math.PI / 6) * sd; // 60° V: each bank 30° off vertical
    return b;
  };
  const engine = group("engine", [
    group(
      "v12",
      [
        rbox(0.8, 0.22, 0.38, M.engine, [0, 0, 0]),
        rbox(0.7, 0.08, 0.3, M.aluminium, [0, -0.13, 0]), // dry sump pan
        bank(1),
        bank(-1),
        mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.7, 20), M.aluminium, [0, 0.4, 0], [0, 0, Math.PI / 2]), // plenum
        ...Array.from({ length: 12 }, (_, i) => {
          const sd = i < 6 ? 1 : -1;
          const k = i % 6;
          return strut([-0.31 + k * 0.124, 0.4, 0.04 * sd], [-0.31 + k * 0.124, 0.33, 0.14 * sd], 0.022, M.aluminium);
        }),
        // Accessory drive at the front of the engine
        mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 28), M.aluminium, [0.42, 0.02, 0], [0, 0, Math.PI / 2]),
        mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), M.aluminium, [0.42, 0.22, 0.13], [0, 0, Math.PI / 2]),
        mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), M.aluminium, [0.42, 0.22, -0.13], [0, 0, Math.PI / 2]),
        mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 40), M.rubber, [0.445, 0.12, 0], [0, Math.PI / 2, 0]),
      ],
      [-0.895, 0.36, 0],
    ),
  ]);
  engine.children[0].userData.vibrate = true;

  // ---------------------------------------------------------------- turbos
  const turbos = group(
    "turbos",
    sides.map((sd) => {
      const x = -1.08;
      const y = 0.42;
      const z = 0.5 * sd;
      const wheel = group("compressor-wheel", Array.from({ length: 8 }, (_, i) => {
        const blade = rbox(0.02, 0.1, 0.008, M.aluminium, [0, 0, 0], [i * (Math.PI / 4), 0, 0], 0.003);
        blade.position.set(0, Math.cos((i * Math.PI) / 4) * 0.035, Math.sin((i * Math.PI) / 4) * 0.035);
        return blade;
      }), [x + 0.05, y, z]);
      wheel.userData.spin = "x";
      const g = group(`turbo-${sd}`, [
        mesh(new THREE.TorusGeometry(0.07, 0.036, 12, 32), M.aluminium, [x + 0.04, y, z], [0, Math.PI / 2, 0]),
        mesh(new THREE.TorusGeometry(0.065, 0.034, 12, 32), M.titanium, [x - 0.1, y, z], [0, Math.PI / 2, 0]),
        mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 20), M.steel, [x - 0.03, y, z], [0, 0, Math.PI / 2]),
        wheel,
        // Charge air: compressor → cooler behind the side intake → plenum
        tube([[x + 0.1, y, z], [x + 0.35, y + 0.08, 0.72 * sd], [-0.5, 0.55, 0.84 * sd]], 0.032, M.aluminium),
        rbox(0.38, 0.24, 0.06, M.dark, [-0.45, 0.56, 0.86 * sd], [0, 0.25 * sd, 0]),
        tube([[-0.42, 0.62, 0.8 * sd], [-0.55, 0.78, 0.35 * sd], [-0.62, 0.76, 0.05 * sd]], 0.03, M.aluminium),
      ]);
      g.userData.side = sd;
      return g;
    }),
  );

  // ---------------------------------------------------------------- gearbox
  const gearbox = group("gearbox", [
    group("xtrac", [
      rbox(0.42, 0.34, 0.78, M.engine, [-1.62, 0.42, 0], undefined, 0.05),
      mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.22, 28), M.aluminium, [-1.36, 0.38, 0], [0, 0, Math.PI / 2]),
      ...Array.from({ length: 5 }, (_, i) => rbox(0.43, 0.012, 0.79, M.aluminium, [-1.62, 0.3 + i * 0.06, 0], undefined, 0.004)),
      ...sides.flatMap((sd) => [
        strut([-1.58, 0.38, 0.38 * sd], [XR, RR, 0.66 * sd], 0.022, M.steel),
        mesh(new THREE.SphereGeometry(0.04, 16, 10), M.steel, [-1.58, 0.38, 0.4 * sd]),
        mesh(new THREE.SphereGeometry(0.04, 16, 10), M.steel, [XR, RR, 0.64 * sd]),
      ]),
    ]),
  ]);

  // ---------------------------------------------------------------- exhaust
  const tips: V3[] = [
    [0.07, 0.07, 0], [-0.07, 0.07, 0], [0.07, -0.07, 0], [-0.07, -0.07, 0],
  ];
  const exhaust = group("exhaust", [
    group("system", [
      ...sides.map((sd) =>
        tube([[-1.18, 0.42, 0.5 * sd], [-1.4, 0.3, 0.48 * sd], [-1.8, 0.3, 0.4 * sd], [-1.95, 0.42, 0.3 * sd]], 0.034, M.titanium),
      ),
      rbox(0.3, 0.22, 0.86, M.titanium, [-2.0, 0.46, 0], undefined, 0.08),
      ...tips.map(([dz, dy]) =>
        mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 24, 1, true), M.titanium, [-2.24, 0.5 + dy, dz], [0, 0, Math.PI / 2]),
      ),
      ...tips.map(([dz, dy]) =>
        mesh(new THREE.CircleGeometry(0.04, 20), M.dark, [-2.36, 0.5 + dy, dz], [0, -Math.PI / 2, 0]),
      ),
      mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 40), M.titanium, [-2.4, 0.5, 0], [0, Math.PI / 2, 0]),
    ]),
  ]);

  // ---------------------------------------------------------------- wheels, brakes, suspension (per corner)
  const wheels = group("wheels");
  const brakes = group("brakes");
  const suspension = group("suspension");

  for (const c of corners) {
    for (const sd of sides) {
      const centre: V3 = [c.x, c.r, c.z * sd];

      // Tyre: lathe a rounded section around the axle.
      const half = c.w / 2;
      const profile = [
        [c.rim, -half], [c.r - 0.035, -half], [c.r - 0.01, -half + 0.012], [c.r, -half + 0.04],
        [c.r, half - 0.04], [c.r - 0.01, half - 0.012], [c.r - 0.035, half], [c.rim, half],
      ].map(([r, y]) => new THREE.Vector2(r, y));
      const tyre = mesh(new THREE.LatheGeometry(profile, 72), M.rubber, [0, 0, 0], [Math.PI / 2, 0, 0]);
      const face = half * sd - 0.03 * sd;
      const spokes = Array.from({ length: 10 }, (_, i) => {
        const ang = (i / 10) * Math.PI * 2;
        const len = c.rim - 0.06;
        const s = rbox(len, 0.03, 0.022, M.aluminium, [Math.cos(ang) * (0.06 + len / 2), Math.sin(ang) * (0.06 + len / 2), face], [0, 0, ang], 0.008);
        return s;
      });
      const wheel = group(`wheel-${c.x > 0 ? "F" : "R"}${sd > 0 ? "L" : "R"}`, [
        tyre,
        mesh(new THREE.CylinderGeometry(c.rim - 0.004, c.rim - 0.004, c.w * 0.92, 48, 1, true), M.aluminium, [0, 0, 0], [Math.PI / 2, 0, 0]),
        mesh(new THREE.TorusGeometry(c.rim - 0.01, 0.012, 8, 64), M.aluminium, [0, 0, face]),
        ...spokes,
        mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 24), M.aluminium, [0, 0, face], [Math.PI / 2, 0, 0]),
        mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 6), M.titanium, [0, 0, face + 0.02 * sd], [Math.PI / 2, 0, 0]),
      ], centre);
      wheel.userData.side = sd;
      wheels.add(wheel);

      const caliper = mesh(new THREE.TorusGeometry(c.disc - 0.035, 0.036, 10, 18, 1.0), M.caliper, [0, 0, 0], [0, 0, Math.PI * 0.55]);
      caliper.scale.set(1, 1, 1.5);
      const brake = group(`brake-${c.x > 0 ? "F" : "R"}${sd > 0 ? "L" : "R"}`, [
        mesh(new THREE.CylinderGeometry(c.disc, c.disc, 0.036, 64), M.ceramic, [0, 0, 0], [Math.PI / 2, 0, 0]),
        mesh(new THREE.CylinderGeometry(c.disc * 0.5, c.disc * 0.5, 0.05, 40), M.aluminium, [0, 0, 0.01 * sd], [Math.PI / 2, 0, 0]),
        caliper,
      ], [c.x, c.r, (c.z - 0.06) * sd]);
      brake.userData.side = sd;
      brakes.add(brake);

      const zi = (c.z - 0.17) * sd; // upright, inboard of the wheel centre
      const arms: THREE.Object3D[] = [
        rbox(0.08, 0.3, 0.06, M.aluminium, [c.x, c.r, zi]),
        // Lower and upper wishbones: two arms each, meeting at the upright
        strut([c.x, c.r - 0.13, zi], [c.x + 0.24, 0.2, 0.38 * sd], 0.015, M.aluminium),
        strut([c.x, c.r - 0.13, zi], [c.x - 0.24, 0.2, 0.38 * sd], 0.015, M.aluminium),
        strut([c.x, c.r + 0.13, zi], [c.x + 0.18, c.r + 0.17, 0.42 * sd], 0.013, M.aluminium),
        strut([c.x, c.r + 0.13, zi], [c.x - 0.18, c.r + 0.17, 0.42 * sd], 0.013, M.aluminium),
      ];
      const lo: V3 = [c.x - 0.06, c.r - 0.08, (c.z - 0.33) * sd];
      const hi: V3 = [c.x - 0.12, c.r + 0.34, 0.44 * sd];
      arms.push(spring(lo, hi, 0.042, 0.007, 7, M.caliper), strut(lo, hi, 0.018, M.aluminium));
      const corner = group(`suspension-${c.x > 0 ? "F" : "R"}${sd > 0 ? "L" : "R"}`, arms);
      corner.userData.side = sd;
      suspension.add(corner);
    }
  }

  // ---------------------------------------------------------------- aero
  const flaps = group(
    "flaps",
    sides.map((sd) => {
      const pivot = group(`flap-${sd}`, [rbox(0.2, 0.012, 0.5, M.carbon, [-0.1, 0, 0], undefined, 0.005)], [-2.1, 0.845, 0.33 * sd]);
      pivot.userData.flap = true;
      return pivot;
    }),
  );
  const aero = group("aero", [flaps]);

  // ---------------------------------------------------------------- cockpit
  const steering = group("steering-wheel", [
    mesh(new THREE.TorusGeometry(0.165, 0.018, 12, 48), M.leather),
    ...[Math.PI / 2, Math.PI * 1.17, -Math.PI * 0.17].map((ang) =>
      strut([0, 0, 0], [Math.cos(ang) * 0.155, Math.sin(ang) * 0.155, 0], 0.011, M.aluminium),
    ),
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 24), M.aluminium, [0, 0, 0], [Math.PI / 2, 0, 0]),
  ], [0.42, 0.68, 0.32]);
  steering.rotation.set(0, Math.PI / 2, 0); // ring faces the driver
  steering.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0.32); // top leans back toward the seat

  const cockpit = group("cockpit", [
    group("cabin", [
      ...sides.flatMap((sd) => [
        rbox(0.46, 0.1, 0.42, M.leather, [0.08, 0.25, 0.32 * sd], undefined, 0.04),
        rbox(0.09, 0.6, 0.42, M.leather, [-0.2, 0.53, 0.32 * sd], [0, 0, 0.33], 0.04),
      ]),
      steering,
      strut([0.76, 0.55, 0.32], [0.45, 0.66, 0.32], 0.02, M.aluminium),
      rbox(0.2, 0.1, 1.28, M.carbon, [0.68, 0.69, 0], undefined, 0.03),
      ...[0.22, 0.42].map((z) =>
        mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 32), M.aluminium, [0.58, 0.74, z], [0, 0, Math.PI / 2 - 0.4]),
      ),
      rbox(0.42, 0.14, 0.17, M.carbon, [0.3, 0.35, 0], undefined, 0.03),
      rbox(0.16, 0.012, 0.12, M.titanium, [0.3, 0.425, 0], undefined, 0.004), // titanium grille
      strut([0.3, 0.43, 0], [0.26, 0.61, 0], 0.009, M.aluminium),
      mesh(new THREE.SphereGeometry(0.034, 24, 16), M.aluminium, [0.255, 0.635, 0]),
      // Exposed shift linkage running back to the transverse gearbox
      strut([0.36, 0.43, 0.05], [0.5, 0.45, 0.05], 0.006, M.titanium),
      strut([0.24, 0.43, -0.05], [0.12, 0.42, -0.05], 0.006, M.titanium),
      tube([[0.18, 0.3, 0.04], [-0.4, 0.28, 0.04], [-1.0, 0.24, 0.04], [-1.42, 0.4, 0.04]], 0.007, M.titanium),
      tube([[0.18, 0.3, -0.04], [-0.4, 0.28, -0.04], [-1.0, 0.24, -0.04], [-1.42, 0.4, -0.04]], 0.007, M.titanium),
    ]),
  ]);

  return bakePieces({ monocoque, subframes, bodywork, engine, turbos, gearbox, exhaust, suspension, brakes, wheels, aero, cockpit });
}

/** Low-cost body-only car for placeholder models in the world. */
export function buildGhost(shape: BodyShape, mat: THREE.Material) {
  const a = axleS(shape);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(loftGeometry(shape, { s0: 0, s1: 1, segS: 60, segT: 40, keep: archCut(shape), capStart: true, capEnd: true }), mat));
  for (const [s, r] of [[a.front, shape.wheelRadius.front], [a.rear, shape.wheelRadius.rear]] as const) {
    for (const sd of [1, -1]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r - 0.06, 0.06, 8, 32), mat);
      t.position.set(sToX(shape, s), r, 0.84 * sd);
      g.add(t);
    }
  }
  return g;
}
