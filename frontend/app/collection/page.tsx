import type { Metadata } from "next";
import { CATALOGUE } from "./_data/catalogue";
import { ModelCard } from "./_components/ModelCard";

export const metadata: Metadata = {
  title: "The Collection — Pagani Atelier",
  description: "Choose a car, hear its V12, and take it apart piece by piece.",
};

export default function CollectionPage() {
  const [featured, ...rest] = CATALOGUE;
  return (
    <div className="mode-scienza min-h-screen">
      <main className="mx-auto max-w-site px-5 py-16 sm:px-8 lg:py-24">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-kicker text-accent">The collection · {CATALOGUE.length} cars</p>
          <h1 className="mt-4 font-display text-[56px] leading-[0.98] lg:text-[96px]">
            The <em>Collection</em>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.7] text-muted">
            Choose a car to enter its atelier. Start the V12, take the car apart piece by piece, and read the science and the history behind every component.
          </p>
        </header>

        <section aria-label="Models" className="mt-16 flex flex-col gap-6">
          <ModelCard model={featured} index={0} featured />
          <div className="grid gap-6 md:grid-cols-2">
            {rest.map((m, i) => (
              <ModelCard key={m.id} model={m} index={i + 1} />
            ))}
          </div>
        </section>

        <footer className="mt-16 flex flex-col gap-2 border-t border-rule pt-6 sm:flex-row sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-label text-muted">Price on request</p>
          <p className="text-[13px] leading-relaxed text-muted">
            Concept study. Not affiliated with Pagani Automobili S.p.A. Figures as published by Pagani.
          </p>
        </footer>
      </main>
    </div>
  );
}
