import Link from "next/link";
import type { CatalogueModel } from "../_data/types";
import { Silhouette } from "./Silhouette";
import { SlotsRemaining } from "./SlotsRemaining";
import { SpecTiles } from "./SpecTiles";

export function ModelCard({ model, index, featured = false }: { model: CatalogueModel; index: number; featured?: boolean }) {
  const label = model.name.join(" ");
  const ready = model.status === "experience";
  return (
    <article
      className={`pc-card pc-reveal group relative flex flex-col border border-rule bg-bg transition-colors duration-200 hover:border-scienza-metal focus-within:border-scienza-metal ${
        featured ? "lg:grid lg:grid-cols-12" : ""
      }`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className={`relative bg-scienza-stage px-6 pb-4 pt-10 sm:px-10 ${featured ? "lg:col-span-7 lg:flex lg:items-center" : ""}`}>
        <span className="absolute left-5 top-4 font-mono text-[11px] uppercase tracking-label text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="absolute right-5 top-4 font-mono text-[11px] uppercase tracking-label text-muted">
          {ready ? "Open in 3D" : "[ 3D in preparation ]"}
        </span>
        <Silhouette shape={model.shape} label={label} />
      </div>

      <div className={`flex flex-1 flex-col p-6 sm:p-8 ${featured ? "lg:col-span-5 lg:border-l lg:border-rule" : "border-t border-rule"}`}>
        <p className="font-mono text-xs uppercase tracking-kicker text-accent">
          {model.family} · {model.kicker}
        </p>
        <h2 className={`mt-3 font-display leading-[1.05] ${featured ? "text-[36px] lg:text-[52px]" : "text-[30px] lg:text-[40px]"}`}>
          <Link href={`/collection/${model.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {model.name[0]} <em>{model.name[1]}</em>
          </Link>
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-[1.7] text-muted">{model.tagline}</p>

        <div className="mt-6">
          <SpecTiles specs={model.keySpecs} size={featured ? "lg" : "md"} cols={featured ? 2 : 4} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <SlotsRemaining id={model.id} unitsBuilt={model.unitsBuilt} />
          <span aria-hidden="true" className="text-sm tracking-[0.04em] text-accent transition-transform duration-200 group-hover:translate-x-1">
            {ready ? "Enter the car →" : "Preview →"}
          </span>
        </div>
      </div>
    </article>
  );
}
