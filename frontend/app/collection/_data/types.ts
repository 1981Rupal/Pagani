/**
 * Content contracts for the Collection.
 *
 * Content (stories, specs, component breakdowns) is versioned with the frontend.
 * Live data (slots remaining) comes from the backend: GET /api/models.
 * See ARCHITECTURE.md §3.
 */

export type ModelId = "utopia-roadster" | "utopia-coupe" | "codalunga-speedster";

export type ComponentId =
  | "monocoque"
  | "subframes"
  | "bodywork"
  | "engine"
  | "turbos"
  | "gearbox"
  | "exhaust"
  | "suspension"
  | "brakes"
  | "wheels"
  | "aero"
  | "cockpit";

export type Spec = { label: string; value: string };

export type Source = { label: string; url?: string };

export type Story = { title: string; paragraphs: string[] };

export type CarComponent = {
  id: ComponentId;
  /** Two-digit order used in the index and the piece-by-piece tour. */
  index: string;
  name: string;
  kicker: string;
  summary: string;
  specs: Spec[];
  science: Story;
  legacy: Story;
  sources: Source[];
  /** Exploded-view offset in metres (x = forward, y = up, z = left). */
  explode: [number, number, number];
};

/** Parameters for the shared body-surface maths (3D loft + SVG silhouette). */
export type BodyShape = {
  length: number;
  width: number;
  wheelbase: number;
  frontOverhang: number;
  /** "open" = roadster/speedster cockpit, "closed" = coupé roof. */
  roof: "open" | "closed";
  /** Extra tail length factor; 0 = standard, >0 = longtail (Codalunga). */
  longtail: number;
  wheelRadius: { front: number; rear: number };
};

/** Where the 3D car comes from. See ARCHITECTURE.md §5 (model pipeline). */
export type ModelSource =
  | { kind: "procedural" }
  | {
      kind: "gltf";
      url: string;
      /** Map each component to node-name patterns (case-insensitive regex). */
      partMap: Partial<Record<ComponentId, string[]>>;
      /** Uniform scale to bring the asset to metres, and a yaw fix so the nose faces +x. */
      scale?: number;
      rotationY?: number;
    };

export type CatalogueModel = {
  id: ModelId;
  /** First word upright, second word italic (Design.md §3). */
  name: [string, string];
  family: string;
  kicker: string;
  tagline: string;
  year: string;
  /** Exactly four tiles on the card: Design.md §5 spec tiles. */
  keySpecs: [Spec, Spec, Spec, Spec];
  /** Total units, used as fallback when the API is unreachable. */
  unitsBuilt: number | null;
  status: "experience" | "placeholder";
  shape: BodyShape;
  source: ModelSource;
  sources: Source[];
};
