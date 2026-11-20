import type { BodyShape, CatalogueModel, ModelId } from "./types";

/**
 * The Collection. Order matters: the opening hands off with the Roadster first
 * (Readme → Handoffs: /collection?from=intro).
 *
 * Facts only from published sources (listed per model). Unknown values stay as
 * [TBC] placeholders, per Design.md §8.
 */

const UTOPIA_SHAPE: BodyShape = {
  length: 4.673,
  width: 2.06,
  wheelbase: 2.796,
  frontOverhang: 1.0,
  roof: "open",
  longtail: 0,
  // 265/35 R21 → Ø 719 mm · 325/30 R22 → Ø 754 mm
  wheelRadius: { front: 0.36, rear: 0.377 },
};

export const CATALOGUE: CatalogueModel[] = [
  {
    id: "utopia-roadster",
    name: ["Utopia", "Roadster"],
    family: "Utopia · C10",
    kicker: "Open · 2024",
    tagline: "A twelve-cylinder heart, a seven-speed manual, and the sky for a roof.",
    year: "2024",
    keySpecs: [
      { label: "Power", value: "864 CV" },
      { label: "Torque", value: "1,100 Nm" },
      { label: "Dry weight", value: "1,280 kg" },
      { label: "Built", value: "130" },
    ],
    unitsBuilt: 130,
    status: "experience",
    shape: UTOPIA_SHAPE,
    // Swap to { kind: "gltf", ... } once a licensed asset lands. See ARCHITECTURE.md §5.
    source: { kind: "procedural" },
    sources: [
      { label: "Pagani — Utopia Roadster technical specifications (2024)", url: "https://pagani.com/app/uploads/2024/07/Pagani-Utopia-Roadster-Technical-Specifications-ENG.pdf" },
      { label: "Ultimatecarpage — Utopia Roadster specifications", url: "https://www.ultimatecarpage.com/spec/8680/Pagani-Utopia-Roadster.html" },
    ],
  },
  {
    id: "utopia-coupe",
    name: ["Utopia", "Coupé"],
    family: "Utopia · C10",
    kicker: "Closed · 2022",
    tagline: "The third act: simplicity, lightness, and a manual gearbox once more.",
    year: "2022",
    keySpecs: [
      { label: "Power", value: "864 CV" },
      { label: "Torque", value: "1,100 Nm" },
      { label: "Dry weight", value: "1,280 kg" },
      { label: "Built", value: "99" },
    ],
    unitsBuilt: 99,
    status: "placeholder",
    shape: { ...UTOPIA_SHAPE, roof: "closed" },
    source: { kind: "procedural" },
    sources: [{ label: "Pagani — Utopia Coupé press material (2022)" }],
  },
  {
    id: "codalunga-speedster",
    name: ["Codalunga", "Speedster"],
    family: "Huayra · Codalunga",
    kicker: "Open longtail · 2025",
    tagline: "A long tail, no roof, no wings. Ten made, each shaped with its owner.",
    year: "2025",
    keySpecs: [
      { label: "Power", value: "864 CV" },
      { label: "Engine", value: "V12 TT" },
      { label: "Dry weight", value: "[TBC]" },
      { label: "Built", value: "10" },
    ],
    unitsBuilt: 10,
    status: "placeholder",
    shape: { ...UTOPIA_SHAPE, length: 4.95, roof: "open", longtail: 0.28 },
    source: { kind: "procedural" },
    sources: [{ label: "Pagani — Huayra Codalunga Speedster press release (2025)", url: "https://www.pagani.com/press/huayra-codalunga-speedster/" }],
  },
];

export function getModel(id: string): CatalogueModel | undefined {
  return CATALOGUE.find((m) => m.id === id);
}

export const MODEL_IDS: ModelId[] = CATALOGUE.map((m) => m.id);
