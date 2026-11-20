# Architecture — Collection & 3D experience

> Owner: Cars + Legacy (`feat/collection-legacy`). Routes `/collection`, `/collection/[model]`, and `GET /api/models`.
> Other areas (opening, atelier, reserve) will document their own systems here as they land.
> Read [`Design.md`](./Design.md) first; this document explains *how* the systems work, not how they look.

---

## 1. What this part does

| Surface | What the visitor gets |
|---|---|
| **`/collection`**: the catalogue | Three cars as cards: name, one line, four spec tiles, a line drawing that sketches itself on hover. No prices. |
| **`/collection/utopia-roadster`**: the full experience | A 3D atelier floor you can orbit and walk. The car comes apart **piece by piece** into 12 components; each one opens its **specs, the science and the legacy**. A **synthesised V12** you hold to start and hold to rev. Studio, wireframe and X-ray views. |
| **`/collection/utopia-coupe`, `/collection/codalunga-speedster`**: placeholders | Same frame, honest placeholder: silhouette, published specs, sources, `[ 3D experience in preparation ]`. They also stand as wireframe ghosts in the Roadster's world. |

---

## 2. System context

```
                        ┌──────────────────────── Browser ─────────────────────────┐
                        │                                                          │
  /collection ─────────►│  Static HTML (prerendered)                               │
                        │   ├─ ModelCard × 3  ← CATALOGUE (frontend content)       │
                        │   └─ SlotsRemaining (client) ── fetch ──┐                │
                        │                                         │                │
  /collection/[model] ─►│  Static shell (prerendered per model)   │                │
                        │   └─ <Experience> (client)              │                │
                        │       ├─ DOM UI: index, dock, story panel, engine console │
                        │       ├─ experienceStore  ◄──────────┐  │                │
                        │       ├─ <Stage> (WebGL, client-only)│  │                │
                        │       │   ├─ CarRig ← PartTree ← procedural | glTF       │
                        │       │   ├─ CameraDirector, Atelier world, Ghosts       │
                        │       │   └─ reads liveTelemetry (no React renders)      │
                        │       └─ EngineSynth (Web Audio) ──► liveTelemetry       │
                        └─────────────────────────────────────────┼────────────────┘
                                                                  ▼
                                    FastAPI  GET /api/models  →  slots remaining
                                             (SEED today, Mongo `reservations` later)

  Hand-offs out:  "Begin your commission" → /atelier/<modelId>   (Customization team)
```

---

## 3. Data: content vs live

One rule: **content ships with the frontend; only what changes at runtime comes from the API.**

| Kind | Where | Why |
|---|---|---|
| Catalogue (names, taglines, key specs, body shape, model source) | `frontend/app/collection/_data/catalogue.ts` | Versioned with the UI that renders it; pages stay fully static. |
| Component stories (specs, science, legacy, sources, explode vectors) | `_data/utopia-roadster.ts` | Long-form, reviewed copy. Same reason. |
| Types (the contract) | `_data/types.ts` | `ModelId`, `ComponentId`, `CarComponent`, `CatalogueModel`, `BodyShape`, `ModelSource`. |
| Slots remaining | `GET /api/models` → `backend/routes/models.py` | The only live number. Fetched client-side, so `/collection` remains a static page; on failure the card falls back to the published build count. |

**Fact policy (Design.md §8).** Every number traces to a source listed on the component (`sources[]`). Anything unconfirmed stays as `[TBC]`. "Science" paragraphs explain general engineering, and any worked numbers (≈ 6 MJ braking energy, 96% of the wheel billet removed) are labelled as calculations from published figures.

### API contract

```http
GET /api/models
200 [{ "id": "utopia-roadster", "name": "Utopia Roadster", "unitsBuilt": 130,
       "slotsRemaining": null, "experience": "3d" }, …]

GET /api/models/{id}   → one item · 422 for an unknown id (Literal-validated)
```

`slotsRemaining: null` means *unknown*. The UI then shows "130 to be made". When `backend/db.py` exists, replace `_slots_taken()` with a count over `reservations` grouped by model. The response shape doesn't change.

---

## 4. Routes and rendering (Next.js 16, Cache Components on)

| File | Renders | Notes |
|---|---|---|
| `app/collection/layout.tsx` | — | Imports `collection.css` (see §11). |
| `app/collection/page.tsx` | Server | Fully static. |
| `app/collection/[model]/page.tsx` | Server | `generateStaticParams` returns all 3 IDs → all prerendered. Params are read **inside `<Suspense>`** (Cache Components' instant-navigation rule). Unknown IDs → `notFound()`. `dynamicParams` is *not* exported (it's incompatible with `cacheComponents`). |
| `_experience/Experience.tsx` | Client | DOM shell, server-rendered for a fast first paint. |
| `_experience/scene/Stage.tsx` | Client only | `next/dynamic(..., { ssr: false })` from inside the client shell. WebGL never touches the server. |

Branching: `status === "experience"` **and** an entry in `_experience/registry.ts` → `<Experience>`, otherwise `<PlaceholderModel>`.

---

## 5. The 3D model pipeline

### 5.1 One contract, two sources

```
          BodyShape (published dims)            licensed .glb
                 │                                   │
     buildRoadster() + loft()              useGltfParts(partMap)
                 │                                   │
                 └──────────►  PartTree  ◄───────────┘
                         Record<ComponentId, Group>
                         each child = a "piece"
                                  │
                              bakePieces()      (procedural only: merge per material)
                                  │
                              createRig()       (clone, per-component materials,
                                  │              wireframe twin, explode vectors, anchors)
                                  │
                              stepRig() each frame
```

**`PartTree` rules** (the only thing the rest of the system knows about meshes):

- One `THREE.Group` per `ComponentId`. Its **direct children are pieces**, and each piece moves as one unit when exploded.
- `piece.userData.side = ±1` mirrors the component's explode vector on z (left/right wheels go outward).
- `piece.userData.explode = [x,y,z]` overrides the component vector (nose goes forward, rear clamshell goes back).
- `obj.userData.spin = "x"` spins with turbo boost. `obj.userData.flap = true` follows the aero toggle. `obj.userData.vibrate = true` trembles with rpm.

### 5.2 Procedural Roadster (what ships today)

There is no licensed Utopia mesh, so the car is **built in code to published dimensions**: 4,673 × 2,060 mm, 2,796 mm wheelbase, and tyre diameters from 265/35 R21 and 325/30 R22.

- **Body**: `_lib/bodyShape.ts` defines the surface as superellipse cross-sections whose height, width and fender lift vary along the car. It's pure maths with no three.js import, so the **server** uses the same curves to draw the catalogue silhouettes. Card and model can't disagree.
- **Panels**: `loft.ts` lofts that surface between stations. Panels, wheel arches and the open cockpit are cut by *dropping quads* (`keep()`), so the doors, nose and rear clamshell come from one continuous surface and fit together exactly.
- **Mechanicals** (V12 with 60° banks, turbos, Xtrac box, exhaust, double wishbones, brakes, cockpit) are primitives placed in plausible positions. **Illustrative, not CAD.** The page says so.
- **Baking** (`bake.ts`) merges each piece's meshes per material: about 350 meshes become a few dozen draw calls.

### 5.3 Swapping in a real model (glTF)

1. Get a licensed `.glb` (see §12). Clean it in Blender and **name nodes by component**: `engine_*`, `wheel_FL`, `brake_*`, `body_nose`, …
2. Drop it in `frontend/public/models/<model>.glb` and compress it (`npx @gltf-transform/cli optimize in.glb out.glb --compress draco`).
3. In `catalogue.ts`, set:
   ```ts
   source: {
     kind: "gltf",
     url: "/models/utopia-roadster.glb",
     scale: 1, rotationY: 0,          // metres, nose → +x
     partMap: { engine: ["^engine", "v12"], wheels: ["^wheel", "tyre"], brakes: ["brake", "caliper", "disc"], … },
   }
   ```
   Each mesh joins the first component whose regex matches its own name or an ancestor's. Unmatched meshes fall back to `bodywork`.
4. Nothing else changes: markers, explode, focus, stories and the wireframe view all work off the `PartTree`.

Limitation: glTF components are one piece each, so per-side explode only works if you split the nodes and set `userData.side` yourself (glTF `extras` map straight to `userData`).

### 5.4 Wireframes and editing

The **Wireframe** view swaps each component to a `MeshBasicMaterial({ wireframe: true })` twin; the selected component turns bronze. Because every part is a named, separately materialled component, the Customization team can build on the same rig to edit it: recolour `bodywork`, swap the `wheels` piece, tint `brakes` calipers. See §13 for the proposed hand-off.

---

## 6. Engine sound system

`_experience/audio/engineSynth.ts`. Pure Web Audio, **no recordings** (no rights issues), and **driven by the physics the page teaches**.

```
bankA ┐                                                   ┌─ comp ─ master ─ analyser ─ speakers
bankB ┴ waveshaper ─ lowpass(rpm) ─ body peak ─ engineGain┤
noise ─ bandpass(rpm) ─ intakeGain ───────────────────────┤
sine  ─ whistleGain (boost) ──────────────────────────────┤
noise ─ highpass ─ blow-off envelope (lift under boost) ──┘
```

- The oscillators run at the **engine cycle** frequency (rpm ÷ 120). A custom `PeriodicWave` puts the energy at the 12th harmonic, the **firing order**: rpm × 12 ÷ 120 = **rpm ÷ 10 Hz**, with 6th and 3rd sub-orders and seeded irregularity for texture. Bank B is detuned 7 cents.
- A small physics loop on `requestAnimationFrame` handles starter cranking, catch-and-flare, throttle lag, a limiter bounce at 6,800 rpm, turbo spool lag and blow-off on lift. **6,800 is a synth constant, not a published redline.** 6,000 rpm (peak power) is published and marked on the tach.
- **Gesture rules (Design.md §7):** the `AudioContext` is created only from *hold to start* (650 ms). Revving is hold-to-rev (pointer, or Space/Enter on the focused button). One engine per page (`getEngine()` singleton). The global **SOUND ON/OFF** sits in the top bar. The engine is disposed on route exit, and audio suspends when the tab is hidden.
- **Telemetry** goes out two ways, neither through React state: (1) `onTelemetry` listeners write rpm, Hz, tach and the oscilloscope straight to DOM refs; (2) the mutable `liveTelemetry` object is read inside `useFrame` to vibrate the V12 and spin the turbo wheels.

> When the opening team builds `frontend/lib/audio.ts` (the shared audio manager in Readme), `EngineSynth` should register with it so there's one global mute across the site.

---

## 7. State

`_experience/store.ts`: a ~60-line external store on `useSyncExternalStore`, with no dependency.

| Field | Used by |
|---|---|
| `selected`, `hovered` | index, markers, story panel, rig fade/highlight, camera focus |
| `explode` (0–1) | slider, `E` key, tour, rig |
| `view` (`studio · blueprint · xray`) | dock, `1/2/3`, rig material swap |
| `camera` `{preset, nonce}` | dock → CameraDirector (nonce re-fires the same preset) |
| `touring`, `tab`, `flapsDeployed`, `muted`, `engineOn` | UI |

Why an external store rather than Context: the R3F canvas and the DOM UI read the same state, and the scene reads it **inside `useFrame` via `experienceStore.get()`** without re-rendering. High-frequency data (rpm, audio) never enters the store.

React Compiler note: scene-graph mutation lives in plain functions (`stepRig`) and behind refs. The lint rule `react-hooks/immutability` forbids mutating memoised values inside components.

---

## 8. Interaction

| Input | Effect |
|---|---|
| Drag / scroll / right-drag | Orbit / zoom-to-cursor / pan (`camera-controls` via drei `<CameraControls>`) |
| **W A S D**, ↑ ↓ | Walk: truck and forward on the floor at ~3 m/s (ignored while typing) |
| Click a part / marker / index item | Select → others fade to 10% → camera frames it from ~35° above, offset clear of the panel |
| ← / → | Previous / next component (when one is selected or touring) |
| `E` | Assemble ↔ explode · `1/2/3` view modes · `Esc` close |
| *Take the tour* | Explode to 60%, start at 01, and step piece by piece with *Next piece →* |
| Camera presets | ¾ · Side · Front · Rear · Top · **Seat** (driver's eye point) |

Focus framing avoids `fitToBox` (it snaps to an axis) and `fitToSphere` (it can end up below the part). Instead it keeps the visitor's heading, fixes the elevation, and sets distance from the bounding sphere and the FOV.

**"Open world".** The car stands on a turntable ring in a large atelier floor: an infinite grid fading into fog, a ring of columns at 21 m, and studio light from `Lightformer`s, so there are no HDR downloads. The **other models stand in the world as wireframe ghosts** with labels that link to their pages. Placeholders are part of the world, not missing content.

---

## 9. Design-system compliance

- Scienza mode throughout. Tokens only in the DOM. WebGL can't read Tailwind, so `scene/palette.ts` mirrors the Scienza tokens one-to-one (UI) and keeps material colours separate (content: Design.md §2 rule 5).
- One primary button per view (*Begin your commission*). Everything else is outline, chip or ghost link. Square corners everywhere except wheels.
- Motion: 700 ms panel rise, 1400 ms sketch draw-in, damped camera. With `prefers-reduced-motion`, camera moves and explode become instant and reveals become a 200 ms fade.
- A11y: real buttons and links, `aria-pressed` on toggles, ARIA tabs for Science/Legacy, a labelled range input for explode, 44 px hit areas (markers are 28 px visual inside 44 px buttons), keyboard parity for everything the mouse does, `aria-live` on engine state, and the canvas has `role="img"` + label.

---

## 10. Performance decisions

| Decision | Why |
|---|---|
| No shadow map; `ContactShadows` at 256 px | A shadow map re-renders every mesh from the light each frame. Contact shadows ground the car for far less. |
| `bakePieces` merge per material | ~350 → a few dozen draw calls. Matters most on integrated GPUs (e.g. Intel UHD). |
| `dpr={[1, 1.75]}` | Caps fill-rate on high-DPI laptops. |
| Environment from `Lightformer`s, `frames={1}` | One PMREM bake, no network. |
| Telemetry → DOM refs, store reads in `useFrame` | No React re-render per frame. |
| Stage code-split, `ssr: false` | three.js stays out of the catalogue bundle and the server. |

---

## 11. Styling note (affects everyone)

`next.config.ts` routes **every** `*.css` through `@tailwindcss/turbopack`, which breaks **CSS Modules**: imported class names come back `undefined`. Until that rule is narrowed (for example to `globals.css`), use plain CSS with a prefix. This area uses `app/collection/collection.css` with `pc-*` classes, imported from `app/collection/layout.tsx`.

---

## 12. 3D assets: sourcing and licensing

We looked for Pagani models to use as editable wireframes. Findings (Nov 2026):

| Source | What | Licence note |
|---|---|---|
| CGTrader | Several Utopia and Utopia Roadster models ($5–$50), some rigged or with interiors | "Royalty Free" for the asset. **It does not grant rights to Pagani's design or trademarks.** |
| RenderHub | Utopia Roadster 2024–25 | "Extended Use, **IP Restricted**": product likeness needs the owner's permission. |
| TurboSquid | Utopia 2023 | Check the listing: branded-vehicle models usually carry IP/editorial-use restrictions. |
| GreatCatalog | Utopia (Zifir3d) | Paid or plan access; licence terms unclear. |
| MakerWorld | Printable Utopia models | Standard Digital File licence: no redistribution, and commercial use is gated. |
| Sketchfab | No Utopia found. Zonda Revolución and "Pagani-inspired" models are downloadable. | Check each model page's licence (CC-BY needs credit; NoDerivatives forbids editing). |

**Recommendation.** For a student concept study, a **royalty-free CGTrader Utopia Roadster** is the practical choice. Keep it **out of the public repo** if the licence forbids redistribution: load it from a private bucket and keep a `.glb` path in `.env`. Credit the author on the page, and keep the "not affiliated with Pagani" notice. **The procedural model stays as the fallback**, so the experience never depends on an asset we may not be allowed to ship. Approval for any real-world use of the design would have to come from Pagani.

---

## 13. Adding or graduating a model

1. Write `_data/<model>.ts`: a `CarComponent[]` using the same `ComponentId`s (a subset is fine).
2. Register it in `_experience/registry.ts`.
3. In `catalogue.ts`, set `status: "experience"`, and either a `gltf` source or a builder. Today `buildRoadster` is Utopia-specific; a Huayra-based car would need its own builder, or a glTF.
4. Nothing in the rig, camera, UI or audio needs to change.

**Proposed hand-off to Customization (`/atelier/[model]`).** Export `createRig` + `PartTree` (move them to `frontend/lib/three/` once the team agrees). The atelier can then load the same car and edit per component: paint on `bodywork` materials, wheel finish, caliper colour. Both pages would show the identical car.

---

## 14. Known gaps and next steps

- **Backend won't boot yet**: `backend/routes/index.py` is empty, but `app.py` imports `router` from it. Adding `router = APIRouter()` there (shared file, not changed here) fixes it. `routes/models.py` is tested on its own and works.
- `backend/db.py` doesn't exist yet, so `slotsRemaining` is `null` until reservations are stored.
- `/legacy` is not built yet. The legacy stories per component already exist in `_data/utopia-roadster.ts` and can feed it.
- Real licensed glTF (§12). The procedural geometry is illustrative.
- The audio manager should be promoted to shared `lib/audio.ts` (§6).
- On phones the commission button is hidden in the experience's top bar (no room). It's still reachable from the placeholder pages and could join the bottom sheet.

---

## 15. File map

```
frontend/app/collection/
  layout.tsx · collection.css            plain CSS (pc-*) — see §11
  page.tsx                               the catalogue
  [model]/page.tsx                       static params → Experience | Placeholder
  _data/   types.ts · catalogue.ts · utopia-roadster.ts
  _lib/    bodyShape.ts                  shared surface maths (server + client)
  _components/                           ModelCard · Silhouette · SpecTiles · SlotsRemaining · PlaceholderModel
  _experience/
    Experience.tsx                       client shell, keyboard map
    store.ts · registry.ts · useReducedMotion.ts
    audio/engineSynth.ts                 V12 synthesis + telemetry
    ui/   ComponentIndex · Dock · StoryPanel · EngineConsole
    scene/
      Stage.tsx                          Canvas, Atelier world, Ghosts, CameraDirector
      CarRig.tsx · rig.ts                rig creation + per-frame step + markers
      sources.tsx                        procedural | glTF → PartTree
      materials.ts · palette.ts
      procedural/ buildRoadster.ts · loft.ts · helpers.ts · bake.ts
backend/routes/models.py                 GET /api/models
```
