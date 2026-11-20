"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getModel } from "../_data/catalogue";
import type { ModelId } from "../_data/types";
import { disposeEngine, getEngine } from "./audio/engineSynth";
import { EXPERIENCES } from "./registry";
import { actions, experienceStore, initialExperienceState, useExperience } from "./store";
import { useReducedMotion } from "./useReducedMotion";
import { ComponentIndex } from "./ui/ComponentIndex";
import { Dock } from "./ui/Dock";
import { EngineConsole } from "./ui/EngineConsole";
import { StoryPanel } from "./ui/StoryPanel";

// WebGL never renders on the server; the DOM shell around it does.
const Stage = dynamic(() => import("./scene/Stage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-scienza-stage">
      <p className="font-mono text-[11px] uppercase tracking-label text-muted">[ Preparing the atelier floor ]</p>
    </div>
  ),
});

export default function Experience({ modelId }: { modelId: ModelId }) {
  const model = getModel(modelId)!;
  const { components } = EXPERIENCES[modelId]!;
  const reducedMotion = useReducedMotion();
  const muted = useExperience((s) => s.muted);
  const selected = useExperience((s) => s.selected);

  // Fresh state per visit; silence the engine on the way out.
  useEffect(() => {
    experienceStore.set(initialExperienceState);
    return () => disposeEngine();
  }, [modelId]);

  // Keyboard: Esc closes, ←/→ steps through components, E explodes, 1–3 switch views.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = experienceStore.get();
      const idx = components.findIndex((c) => c.id === s.selected);
      switch (e.key) {
        case "Escape":
          actions.select(null);
          actions.setTouring(false);
          break;
        case "ArrowRight":
        case "ArrowLeft": {
          if (idx < 0 && !s.touring) return;
          const d = e.key === "ArrowRight" ? 1 : -1;
          actions.select(components[(Math.max(idx, 0) + d + components.length) % components.length].id);
          break;
        }
        case "e":
        case "E":
          actions.setExplode(s.explode > 0.5 ? 0 : 1);
          break;
        case "1":
          actions.setView("studio");
          break;
        case "2":
          actions.setView("blueprint");
          break;
        case "3":
          actions.setView("xray");
          break;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [components]);

  return (
    <div className="mode-scienza fixed inset-0 flex flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-rule px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/collection" className="flex h-11 items-center text-sm text-muted transition-colors duration-150 hover:text-fg">
            ← <span className="ml-2 hidden sm:inline">Collection</span>
          </Link>
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-label text-accent">{model.family} · {model.unitsBuilt} built</p>
            <h1 className="truncate font-display text-2xl leading-none">
              {model.name[0]} <em>{model.name[1]}</em>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-pressed={!muted}
            onClick={() => {
              actions.setMuted(!muted);
              getEngine().setMuted(!muted);
            }}
            className="flex h-11 items-center px-2 font-mono text-[11px] uppercase tracking-label text-muted transition-colors duration-150 hover:text-fg"
          >
            Sound {muted ? "off" : "on"}
          </button>
          <Link
            href={`/atelier/${model.id}`}
            className="hidden h-[52px] items-center bg-accent px-[26px] text-sm font-semibold tracking-[0.04em] text-on-accent transition-opacity duration-150 hover:opacity-90 md:inline-flex"
          >
            Begin your commission
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Left rail: index + engine (desktop) */}
        <div className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-r border-rule lg:flex">
          <div className="p-5">
            <EngineConsole />
          </div>
          <ComponentIndex components={components} layout="rail" />
        </div>

        <main className="relative min-w-0 flex-1">
          <h2 className="sr-only">Explore the {model.name.join(" ")} component by component</h2>
          {/* Overlays (dock, panel, markers) sit above the canvas, so R3F never sees the
              pointer leave a mesh when it moves onto them. Clear hover here instead. */}
          <div className="absolute inset-0" onPointerLeave={() => actions.hover(null)}>
            <Stage model={model} components={components} reducedMotion={reducedMotion} />
          </div>

          <p className="pointer-events-none absolute left-5 top-4 z-10 hidden font-mono text-[11px] uppercase tracking-label text-muted md:block">
            Drag · orbit &nbsp; Scroll · zoom &nbsp; Right-drag · pan &nbsp; W A S D · walk &nbsp; E · explode
          </p>

          {/* Right: the story of the selected piece */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-auto z-20 flex max-h-[62%] p-3 lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[420px] lg:p-5">
            <div className="pointer-events-auto flex w-full min-h-0">
              <StoryPanel components={components} />
            </div>
          </div>

          {/* Bottom: controls */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 lg:p-5 ${selected ? "max-lg:hidden lg:pr-[440px]" : ""}`}
          >
            <Dock components={components} />
          </div>
        </main>
      </div>

      {/* Small screens: component strip */}
      <div className="lg:hidden">
        <ComponentIndex components={components} layout="strip" />
      </div>
    </div>
  );
}
