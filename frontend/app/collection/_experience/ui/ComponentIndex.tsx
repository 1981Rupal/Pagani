"use client";

import type { CarComponent } from "../../_data/types";
import { actions, useExperience } from "../store";

/** Desktop: vertical list. Mobile: horizontal strip. Same buttons either way. */
export function ComponentIndex({ components, layout }: { components: CarComponent[]; layout: "rail" | "strip" }) {
  const selected = useExperience((s) => s.selected);
  const hovered = useExperience((s) => s.hovered);

  if (layout === "strip") {
    return (
      <nav aria-label="Components" className="overflow-x-auto border-y border-rule bg-panel [scrollbar-width:none]">
        <ul className="flex w-max">
          {components.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={selected === c.id}
                onClick={() => actions.select(selected === c.id ? null : c.id)}
                className={`flex h-11 items-center gap-2 border-r border-rule px-4 text-[13px] whitespace-nowrap transition-colors duration-150 ${
                  selected === c.id ? "bg-scienza-text text-scienza-page" : "text-fg"
                }`}
              >
                <span className="font-mono text-[11px] text-muted">{c.index}</span>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Components">
      <p className="px-5 pb-3 font-mono text-[11px] uppercase tracking-label text-muted">
        Components · {components.length}
      </p>
      <ul className="border-t border-rule">
        {components.map((c) => {
          const active = selected === c.id;
          return (
            <li key={c.id} className="border-b border-rule">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => actions.select(active ? null : c.id)}
                onPointerEnter={() => actions.hover(c.id)}
                onPointerLeave={() => actions.hover(null)}
                onFocus={() => actions.hover(c.id)}
                onBlur={() => actions.hover(null)}
                className={`flex min-h-11 w-full items-baseline gap-3 px-5 py-2.5 text-left transition-colors duration-150 ${
                  active ? "bg-scienza-rule" : hovered === c.id ? "bg-scienza-stage" : ""
                }`}
              >
                <span className={`font-mono text-[11px] ${active ? "text-accent" : "text-muted"}`}>{c.index}</span>
                <span className="flex-1">
                  <span className="block text-[14px] leading-snug text-fg">{c.name}</span>
                  <span className="block font-mono text-[11px] uppercase tracking-label text-muted">{c.kicker}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
