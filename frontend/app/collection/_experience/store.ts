"use client";

import { useSyncExternalStore } from "react";
import type { ComponentId } from "../_data/types";

/**
 * One tiny external store shared by the DOM UI and the R3F scene.
 * No dependency: useSyncExternalStore is enough at this size.
 * High-frequency values (rpm, audio) never go through here; see audio/engineSynth.ts.
 */

export type ViewMode = "studio" | "blueprint" | "xray";
export type CameraPreset = "three-quarter" | "side" | "front" | "rear" | "top" | "cockpit";
export type StoryTab = "science" | "legacy";

export type ExperienceState = {
  selected: ComponentId | null;
  hovered: ComponentId | null;
  /** 0 = assembled, 1 = fully exploded. */
  explode: number;
  view: ViewMode;
  tab: StoryTab;
  /** Bumping `nonce` re-triggers the same preset. */
  camera: { preset: CameraPreset; nonce: number };
  /** When true, the camera follows the selection. */
  touring: boolean;
  flapsDeployed: boolean;
  muted: boolean;
  engineOn: boolean;
};

type Listener = () => void;

function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      const next = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const initialExperienceState: ExperienceState = {
  selected: null,
  hovered: null,
  explode: 0,
  view: "studio",
  tab: "science",
  camera: { preset: "three-quarter", nonce: 0 },
  touring: false,
  flapsDeployed: false,
  muted: false,
  engineOn: false,
};

export const experienceStore = createStore<ExperienceState>(initialExperienceState);

export function useExperience<S>(selector: (s: ExperienceState) => S): S {
  return useSyncExternalStore(
    experienceStore.subscribe,
    () => selector(experienceStore.get()),
    () => selector(initialExperienceState),
  );
}

export const actions = {
  select(id: ComponentId | null) {
    experienceStore.set({ selected: id });
  },
  hover(id: ComponentId | null) {
    if (experienceStore.get().hovered !== id) experienceStore.set({ hovered: id });
  },
  setExplode(v: number) {
    experienceStore.set({ explode: Math.min(1, Math.max(0, v)) });
  },
  setView(view: ViewMode) {
    experienceStore.set({ view });
  },
  setTab(tab: StoryTab) {
    experienceStore.set({ tab });
  },
  camera(preset: CameraPreset) {
    experienceStore.set((s) => ({ camera: { preset, nonce: s.camera.nonce + 1 }, selected: null, touring: false }));
  },
  setTouring(touring: boolean) {
    experienceStore.set({ touring });
  },
  toggleFlaps() {
    experienceStore.set((s) => ({ flapsDeployed: !s.flapsDeployed }));
  },
  setMuted(muted: boolean) {
    experienceStore.set({ muted });
  },
  setEngineOn(engineOn: boolean) {
    experienceStore.set({ engineOn });
  },
};
