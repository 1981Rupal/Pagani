import Link from "next/link";
import { CATALOGUE } from "../_data/catalogue";
import type { CatalogueModel } from "../_data/types";
import { Silhouette } from "./Silhouette";
import { SpecTiles } from "./SpecTiles";

/** A model whose 3D experience isn't built yet. Same frame, honest placeholder. */
export function PlaceholderModel({ model }: { model: CatalogueModel }) {
  const live = CATALOGUE.find((m) => m.status === "experience");
  const label = model.name.join(" ");
  return (
    <div className="mode-scienza min-h-screen">
      <main className="mx-auto max-w-site px-5 py-10 sm:px-8 lg:py-16">
        <Link href="/collection" className="inline-flex h-11 items-center text-sm text-muted transition-colors duration-150 hover:text-fg">
          ← Collection
        </Link>

        <header className="mt-8 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-kicker text-accent">
            {model.family} · {model.kicker}
          </p>
          <h1 className="mt-4 font-display text-[48px] leading-none lg:text-[84px]">
            {model.name[0]} <em>{model.name[1]}</em>
          </h1>
          <p className="mt-5 text-[17px] leading-[1.7] text-muted">{model.tagline}</p>
        </header>

        <figure className="mt-12 border border-rule bg-scienza-stage px-6 pb-6 pt-12 sm:px-16">
          <Silhouette shape={model.shape} label={label} />
          <figcaption className="mt-4 text-center font-mono text-[11px] uppercase tracking-label text-muted">
            [ 3D experience in preparation · {label} ]
          </figcaption>
        </figure>

        <div className="mt-6">
          <SpecTiles specs={model.keySpecs} size="lg" />
        </div>

        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {live && (
            <Link href={`/collection/${live.id}`} className="inline-flex h-11 items-center text-sm tracking-[0.04em] text-accent">
              Explore the {live.name.join(" ")} in 3D →
            </Link>
          )}
          <Link
            href={`/atelier/${model.id}`}
            className="inline-flex h-[52px] items-center justify-center bg-accent px-[26px] text-sm font-semibold tracking-[0.04em] text-on-accent transition-opacity duration-150 hover:opacity-90"
          >
            Begin your commission
          </Link>
        </div>

        <footer className="mt-16 border-t border-rule pt-6">
          <p className="font-mono text-[11px] uppercase tracking-label text-muted">Sources</p>
          <ul className="mt-2">
            {model.sources.map((s) => (
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
        </footer>
      </main>
    </div>
  );
}
