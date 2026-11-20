import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModel, MODEL_IDS } from "../_data/catalogue";
import Experience from "../_experience/Experience";
import { EXPERIENCES } from "../_experience/registry";
import { PlaceholderModel } from "../_components/PlaceholderModel";

// All three model pages are prerendered; anything else is a 404.
export function generateStaticParams() {
  return MODEL_IDS.map((model) => ({ model }));
}

export async function generateMetadata({ params }: PageProps<"/collection/[model]">): Promise<Metadata> {
  const { model } = await params;
  const m = getModel(model);
  if (!m) return {};
  return {
    title: `${m.name.join(" ")} — Pagani Atelier`,
    description: m.tagline,
  };
}

/**
 * Params are read inside <Suspense> so navigation stays instant under Cache
 * Components; all three IDs are prerendered, so the fallback is rarely seen.
 */
export default function ModelPage({ params }: PageProps<"/collection/[model]">) {
  return (
    <Suspense fallback={<div className="mode-scienza fixed inset-0" aria-busy="true" />}>
      {params.then(({ model }) => (
        <ModelContent id={model} />
      ))}
    </Suspense>
  );
}

function ModelContent({ id }: { id: string }) {
  const m = getModel(id);
  if (!m) notFound();
  if (m.status === "experience" && EXPERIENCES[m.id]) return <Experience modelId={m.id} />;
  return <PlaceholderModel model={m} />;
}
