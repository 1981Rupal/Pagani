"use client";

import { useEffect, useState } from "react";
import type { ModelId } from "../_data/types";

type ApiModel = { id: ModelId; unitsBuilt: number | null; slotsRemaining: number | null };

/**
 * Live "slots remaining" from the backend (GET /api/models).
 * Fetched on the client so the catalogue stays a static page; if the API is
 * unreachable the card simply shows the published build count.
 */
export function SlotsRemaining({ id, unitsBuilt }: { id: ModelId; unitsBuilt: number | null }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    const ctrl = new AbortController();
    fetch(`${base}/models`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((list: ApiModel[] | null) => {
        const hit = list?.find((m) => m.id === id);
        if (hit && typeof hit.slotsRemaining === "number") setRemaining(hit.slotsRemaining);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [id]);

  return (
    <p className="font-mono text-[11px] uppercase tracking-label text-muted" aria-live="polite">
      {remaining !== null && unitsBuilt
        ? `${remaining} of ${unitsBuilt} open`
        : unitsBuilt
          ? `${unitsBuilt} to be made`
          : "Numbers [TBC]"}
    </p>
  );
}
