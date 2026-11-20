"use client";

import React, { useState } from "react";
import type { VehicleConfiguration, VehicleOptions } from "@/lib/atelierApi";
import { demoMaterials, formatOptionLabel } from "@/lib/vehicleAssetMap";

type Props = {
  configuration: VehicleConfiguration | null;
  vehicleOptions: VehicleOptions | null;
  onApplyChange: (path: string, value: string) => Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  busy: boolean;
  warnings?: string[];
};

export function ManualEditor({
  configuration,
  vehicleOptions,
  onApplyChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  busy,
  warnings,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<"exterior" | "wheels" | "interior" | "bespoke">("exterior");

  if (!configuration) {
    return (
      <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-8 text-center text-zinc-400">
        <p className="text-sm font-medium text-white mb-1">No Active Configuration</p>
        <p className="text-xs">
          Generate proposals in the AI Consultation tab or select a concept to begin manual craftsmanship.
        </p>
      </div>
    );
  }

  const options = vehicleOptions?.options || {};
  const ext = configuration.exterior || {};
  const wheels = configuration.wheels || {};
  const interior = configuration.interior || {};
  const bespoke = configuration.bespoke || {};

  return (
    <div className="space-y-6 bg-zinc-950/80 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-md">
      {/* Header with Undo / Redo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
              Manual Atelier
            </span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-[11px] text-zinc-400 font-mono">
              ID: {configuration.id ? configuration.id.slice(0, 8) : "Session"}
            </span>
          </div>
          <h2 className="text-2xl font-serif text-white tracking-wide">
            Component Customizer
          </h2>
        </div>

        {/* Undo / Redo controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canUndo || busy}
            onClick={onUndo}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            title="Undo last modification"
          >
            <span>&larr;</span> Undo
          </button>
          <button
            type="button"
            disabled={!canRedo || busy}
            onClick={onRedo}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            title="Redo modification"
          >
            Redo <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Warnings banner if returned by backend PATCH */}
      {warnings && warnings.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 leading-relaxed">
          <strong>Validation Notice:</strong>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex border-b border-white/10 text-xs uppercase tracking-wider font-medium gap-6">
        {(
          [
            ["exterior", "Exterior & Aero"],
            ["wheels", "Wheels & Dynamics"],
            ["interior", "Cockpit & Upholstery"],
            ["bespoke", "Bespoke Details"],
          ] as const
        ).map(([cat, label]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`pb-3 transition-colors relative ${
              activeCategory === cat
                ? "text-[#C5A059] font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
            {activeCategory === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]" />
            )}
          </button>
        ))}
      </div>

      {/* Category Options Grid */}
      <div className="space-y-6">
        {/* EXTERIOR */}
        {activeCategory === "exterior" && (
          <div className="space-y-6">
            {/* Body Paint */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                Sculpted Body Paint
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(options["exterior.body_color"] || []).map((color) => {
                  const isCurrent = ext.body_color === color;
                  const hex = demoMaterials[color] || "#075E43";
                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={busy}
                      onClick={() => onApplyChange("exterior.body_color", color)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isCurrent
                          ? "bg-[#C5A059]/15 border-[#C5A059] shadow-sm"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs text-zinc-200 font-medium truncate">
                        {formatOptionLabel(color)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Carbon Finish */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                Exposed Carbon Fibre Weave
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(options["exterior.carbon_finish"] || []).map((finish) => {
                  const isCurrent = ext.carbon_finish === finish;
                  return (
                    <button
                      key={finish}
                      type="button"
                      disabled={busy}
                      onClick={() => onApplyChange("exterior.carbon_finish", finish)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? "bg-[#C5A059]/15 border-[#C5A059]"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <span className="text-xs text-zinc-200 font-medium">
                        {formatOptionLabel(finish)}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-[#C5A059] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WHEELS */}
        {activeCategory === "wheels" && (
          <div className="space-y-6">
            {/* Wheel Finish */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                Forged Monoblock Rim Finish
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(options["wheels.finish"] || []).map((finish) => {
                  const isCurrent = wheels.finish === finish;
                  const hex = demoMaterials[finish] || "#B69A62";
                  return (
                    <button
                      key={finish}
                      type="button"
                      disabled={busy}
                      onClick={() => onApplyChange("wheels.finish", finish)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isCurrent
                          ? "bg-[#C5A059]/15 border-[#C5A059]"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs text-zinc-200 font-medium truncate">
                        {formatOptionLabel(finish)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wheel Design */}
            {(options["wheels.design"] || []).length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                  Wheel Spoke Architecture
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(options["wheels.design"] || []).map((design) => {
                    const isCurrent = wheels.design === design;
                    return (
                      <button
                        key={design}
                        type="button"
                        disabled={busy}
                        onClick={() => onApplyChange("wheels.design", design)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isCurrent
                            ? "bg-[#C5A059]/15 border-[#C5A059]"
                            : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs text-zinc-200 font-medium">
                          {formatOptionLabel(design)}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-[#C5A059] font-bold uppercase">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERIOR */}
        {activeCategory === "interior" && (
          <div className="space-y-6">
            {/* Seat Leather / Material */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                Cockpit Materiality
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(options["interior.seat_material"] || []).map((mat) => {
                  const isCurrent = interior.seat_material === mat;
                  return (
                    <button
                      key={mat}
                      type="button"
                      disabled={busy}
                      onClick={() => onApplyChange("interior.seat_material", mat)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? "bg-[#C5A059]/15 border-[#C5A059]"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <span className="text-xs text-zinc-200 font-medium">
                        {formatOptionLabel(mat)}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-[#C5A059] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seat Color */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                Primary Leather Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(options["interior.seat_color"] || []).map((color) => {
                  const isCurrent = interior.seat_color === color;
                  const hex = demoMaterials[color] || "#A66F42";
                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={busy}
                      onClick={() => onApplyChange("interior.seat_color", color)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isCurrent
                          ? "bg-[#C5A059]/15 border-[#C5A059]"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs text-zinc-200 font-medium truncate">
                        {formatOptionLabel(color)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stitching */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
                Hand-Crafted Contrast Stitching
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(options["interior.stitching"] || []).map((stitch) => {
                  const isCurrent = interior.stitching === stitch;
                  const hex = demoMaterials[stitch] || "#D9C9A8";
                  return (
                    <button
                      key={stitch}
                      type="button"
                      disabled={busy}
                      onClick={() => onApplyChange("interior.stitching", stitch)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isCurrent
                          ? "bg-[#C5A059]/15 border-[#C5A059]"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs text-zinc-200 font-medium truncate">
                        {formatOptionLabel(stitch)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* BESPOKE */}
        {activeCategory === "bespoke" && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider text-zinc-300 font-semibold block">
              Headrest &amp; Cockpit Monogram Embroidery
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(options["bespoke.embroidery"] || ["none", "customer_initials"]).map((emb) => {
                const isCurrent = bespoke.embroidery === emb;
                return (
                  <button
                    key={emb}
                    type="button"
                    disabled={busy}
                    onClick={() => onApplyChange("bespoke.embroidery", emb)}
                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? "bg-[#C5A059]/15 border-[#C5A059]"
                        : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {emb === "none" ? "None (Pure Carbon Back)" : "Custom Initial Monogram"}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {emb === "none"
                          ? "Clean headrest surfaces without embroidery"
                          : "Hand-stitched patron monogram on headrests"}
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] text-[#C5A059] font-bold uppercase shrink-0 ml-2">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

