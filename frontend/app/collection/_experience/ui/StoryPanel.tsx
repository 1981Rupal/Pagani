"use client";

import type { CarComponent } from "../../_data/types";
import { actions, useExperience } from "../store";
import { EngineConsole } from "./EngineConsole";

const SOUND_PARTS = new Set(["engine", "turbos", "exhaust"]);

export function StoryPanel({ components }: { components: CarComponent[] }) {
  const selectedId = useExperience((s) => s.selected);
  const tab = useExperience((s) => s.tab);
  const touring = useExperience((s) => s.touring);
  const flaps = useExperience((s) => s.flapsDeployed);
  const i = components.findIndex((c) => c.id === selectedId);
  const c = components[i];
  if (!c) return null;

  const go = (d: number) => actions.select(components[(i + d + components.length) % components.length].id);
  const story = tab === "science" ? c.science : c.legacy;

  return (
    <aside
      key={c.id}
      aria-labelledby="story-title"
      className={`pc-panel-rise pointer-events-auto flex max-h-full flex-col border border-rule bg-panel`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-rule p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-kicker text-accent">
            {c.index} / {String(components.length).padStart(2, "0")} · {c.kicker}
          </p>
          <h2 id="story-title" className="mt-2 font-display text-[30px] leading-[1.1]">
            {c.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            actions.select(null);
            actions.setTouring(false);
          }}
          aria-label="Close component story"
          className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors duration-150 hover:text-fg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="text-[15px] leading-[1.7] text-muted">{c.summary}</p>

        <dl className="mt-5 grid grid-cols-2 gap-px border border-rule bg-rule">
          {c.specs.map((s) => (
            <div key={s.label} className="bg-panel p-3">
              <dt className="font-mono text-[11px] uppercase tracking-label text-muted">{s.label}</dt>
              <dd className="mt-1 font-mono text-[15px] leading-snug text-scienza-metal">{s.value}</dd>
            </div>
          ))}
        </dl>

        {/* Desktop keeps the console in the left rail; small screens get it here. */}
        {SOUND_PARTS.has(c.id) && (
          <div className="mt-5 lg:hidden">
            <EngineConsole />
          </div>
        )}

        {c.id === "aero" && (
          <button
            type="button"
            onClick={actions.toggleFlaps}
            aria-pressed={flaps}
            className="mt-5 h-11 w-full border border-scienza-metal text-sm tracking-[0.04em] text-fg transition-colors duration-150 hover:bg-scienza-rule"
          >
            {flaps ? "Lower the flaps" : "Raise the flaps"}
          </button>
        )}

        <div role="tablist" aria-label="Story" className="mt-6 flex border-b border-rule">
          {(["science", "legacy"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls="story-body"
              onClick={() => actions.setTab(t)}
              className={`-mb-px h-11 border-b px-4 font-mono text-xs uppercase tracking-kicker transition-colors duration-150 ${
                tab === t ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t === "science" ? "The science" : "The legacy"}
            </button>
          ))}
        </div>

        <div id="story-body" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-5">
          <h3 className="font-display text-[22px] leading-tight">{story.title}</h3>
          {story.paragraphs.map((p, k) => (
            <p key={k} className="mt-3 text-[15px] leading-[1.7] text-fg/90">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-6 border-t border-rule pt-4">
          <p className="font-mono text-[11px] uppercase tracking-label text-muted">Sources</p>
          <ul className="mt-2 space-y-1">
            {c.sources.map((s) => (
              <li key={s.label} className="text-[13px] leading-relaxed text-muted">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-rule underline-offset-4 hover:text-fg">
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="grid grid-cols-2 border-t border-rule">
        <button
          type="button"
          onClick={() => go(-1)}
          className="h-[52px] border-r border-rule px-5 text-left text-sm tracking-[0.04em] text-muted transition-colors duration-150 hover:text-fg"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="h-[52px] px-5 text-right text-sm tracking-[0.04em] text-accent transition-colors duration-150 hover:text-fg"
        >
          {touring ? "Next piece →" : "Next →"}
        </button>
      </footer>
    </aside>
  );
}
