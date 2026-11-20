import type { CarComponent, ModelId } from "../_data/types";
import { ROADSTER_COMPONENTS } from "../_data/utopia-roadster";

/**
 * Which models have a full 3D experience. To graduate a placeholder:
 *  1. write `_data/<model>.ts` with its CarComponent[] (same 12 ids, or a subset)
 *  2. add it here
 *  3. set `status: "experience"` (and optionally a glTF `source`) in catalogue.ts
 * See ARCHITECTURE.md §8.
 */
export const EXPERIENCES: Partial<Record<ModelId, { components: CarComponent[] }>> = {
  "utopia-roadster": { components: ROADSTER_COMPONENTS },
};
