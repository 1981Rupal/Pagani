"use client";

import type { CarComponent } from "../../_data/types";
import { actions, useExperience, type CameraPreset, type ViewMode } from "../store";

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "blueprint", label: "Wireframe" },
  { id: "xray", label: "X-ray" },
];

const CAMERAS: { id: CameraPreset; label: string }[] = [
  { id: "three-quarter", label: "¾" },
  { id: "side", label: "Side" },
  { id: "front", label: "Front" },
  { id: "rear", label: "Rear" },
  { id: "top", label: "Top" },
  { id: "cockpit", label: "Seat" },
];

const chip = (on: boolean) =>
  `h-11 px-3.5 text-[13px] border transition-colors duration-150 ${
    on ? "border-scienza-text bg-scienza-text text-scienza-page" : "border-rule text-fg hover:border-scienza-metal"
  }`;

export function Dock({ components }: { components: CarComponent[] }) {
  const view = useExperience((s) => s.view);
  const explode = useExperience((s) => s.explode);
  const touring = useExperience((s) => s.touring);

  const startTour = () => {
    if (touring) {
      actions.setTouring(false);
      actions.select(null);
      return;
    }
    actions.setTouring(true);
    actions.setExplode(Math.max(explode, 0.6));
    actions.select(components[0].id);
  };

  return (
    <div className="pointer-events-auto flex flex-wrap items-end gap-x-6 gap-y-3 border border-rule bg-panel px-4 py-3">
      <fieldset>
        <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-label text-muted">View</legend>
        <div className="flex gap-1.5">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => actions.setView(v.id)} className={chip(view === v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="min-w-48 flex-1">
        <label htmlFor="explode" className="mb-1.5 flex justify-between font-mono text-[11px] uppercase tracking-label text-muted">
          <span>Assembled</span>
          <span>Piece by piece</span>
        </label>
        <input
          id="explode"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(explode * 100)}
          onChange={(e) => actions.setExplode(Number(e.target.value) / 100)}
          aria-valuetext={`${Math.round(explode * 100)}% exploded`}
          className={`pc-range block h-11 w-full`}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-label text-muted">Camera</legend>
        <div className="flex gap-1.5">
          {CAMERAS.map((c) => (
            <button key={c.id} type="button" onClick={() => actions.camera(c.id)} className={chip(false)} aria-label={`Camera: ${c.id.replace("-", " ")}`}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="button" onClick={startTour} aria-pressed={touring} className={chip(touring)}>
        {touring ? "End the tour" : "Take the tour"}
      </button>
    </div>
  );
}
