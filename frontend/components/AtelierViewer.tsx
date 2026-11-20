"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { VehicleConfiguration } from "@/lib/atelierApi";

const Viewer3DInternal = dynamic(
  () => import("./Viewer3D").then((mod) => mod.Viewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] lg:min-h-[580px] bg-[#0F1015] rounded-2xl border border-white/10 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">
          Loading 3D Studio...
        </span>
        <span className="text-[11px] text-zinc-400 mt-1">Initializing WebGL graphics engine</span>
      </div>
    ),
  }
);

export function AtelierViewer({
  configuration,
  modelUrl,
}: {
  configuration?: VehicleConfiguration | null;
  modelUrl?: string | null;
}) {
  return <Viewer3DInternal configuration={configuration} modelUrl={modelUrl} />;
}

