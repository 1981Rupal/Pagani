import type { Spec } from "../_data/types";

/** Design.md §5: four tiles, panel background, 1px rule gaps. */
export function SpecTiles({ specs, size = "md", cols = 4 }: { specs: Spec[]; size?: "md" | "lg"; cols?: 2 | 4 }) {
  return (
    <dl className={`grid grid-cols-2 gap-px border border-rule bg-rule ${cols === 4 ? "sm:grid-cols-4" : ""}`}>
      {specs.map((s) => (
        <div key={s.label} className="bg-panel px-4 py-3">
          <dt className="font-mono text-[11px] uppercase tracking-label text-muted">{s.label}</dt>
          <dd className={`mt-1 whitespace-nowrap font-mono text-scienza-metal tabular-nums ${size === "lg" ? "text-[22px]" : "text-[18px]"}`}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
