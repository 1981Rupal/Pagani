"use client";

import React from "react";
import type { VehicleConfiguration } from "@/lib/atelierApi";
import { demoMaterials, formatOptionLabel } from "@/lib/vehicleAssetMap";

type Props = {
  proposals: VehicleConfiguration[];
  selectedConfigurationId?: string | null;
  onSelectProposal: (proposal: VehicleConfiguration) => void;
  note?: string;
};

export function ProposalGrid({
  proposals,
  selectedConfigurationId,
  onSelectProposal,
  note,
}: Props) {
  if (!proposals || proposals.length === 0) return null;

  return (
    <div className="space-y-6 bg-zinc-950/80 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-md">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            Stage 02
          </span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-xs uppercase tracking-wider text-zinc-400">Design Proposals</span>
        </div>
        <h2 className="text-2xl font-serif text-white tracking-wide">
          Curated Atelier Concepts
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          The AI engine has shaped three distinctive interpretations of your design brief.
          Select any proposal to preview it in the interactive 3D studio and refine it further in the Manual Atelier.
        </p>
      </div>

      {note && (
        <div className="text-[11px] text-[#C5A059]/90 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-lg p-3 leading-relaxed">
          <strong>Atelier Guidance:</strong> {note}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {proposals.map((proposal, idx) => {
          const isSelected = selectedConfigurationId === proposal.id;
          const ext = proposal.exterior || {};
          const wheels = proposal.wheels || {};
          const interior = proposal.interior || {};
          const warnings = proposal.validation_warnings || [];

          const bodyHex = demoMaterials[ext.body_color] || "#075E43";
          const wheelHex = demoMaterials[wheels.finish] || "#B69A62";
          const seatHex = demoMaterials[interior.seat_color] || "#A66F42";

          return (
            <div
              key={proposal.id || idx}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                isSelected
                  ? "bg-gradient-to-b from-[#181920] to-[#111217] border-[#C5A059] shadow-[0_0_25px_rgba(197,160,89,0.2)]"
                  : "bg-zinc-900/60 border-white/10 hover:border-white/20"
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2.5 right-4 bg-[#C5A059] text-black text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
                  Active in Studio
                </div>
              )}

              <div>
                {/* Proposal Title */}
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-1">
                  Proposal 0{idx + 1}
                </div>
                <h3 className="text-base font-serif text-white tracking-wide mb-3">
                  {proposal.proposal_name || `Interpretation ${idx + 1}`}
                </h3>

                {/* Color Swatch Badges */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-black/40 rounded-xl border border-white/5">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: bodyHex }}
                    title={`Body: ${ext.body_color}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: wheelHex }}
                    title={`Wheels: ${wheels.finish}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: seatHex }}
                    title={`Interior: ${interior.seat_color}`}
                  />
                  <span className="text-[11px] text-zinc-300 ml-1 font-medium">
                    {formatOptionLabel(ext.body_color || "Standard")}
                  </span>
                </div>

                {/* Specification Table */}
                <dl className="space-y-1.5 text-xs border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Paint:</dt>
                    <dd className="text-zinc-200 font-medium">{formatOptionLabel(ext.body_color || "—")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Carbon:</dt>
                    <dd className="text-zinc-200 font-medium">{formatOptionLabel(ext.carbon_finish || "—")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Wheels:</dt>
                    <dd className="text-[#C5A059] font-medium">{formatOptionLabel(wheels.finish || "—")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Seats:</dt>
                    <dd className="text-zinc-200 font-medium">
                      {formatOptionLabel(interior.seat_color || "—")} ({formatOptionLabel(interior.seat_material || "leather")})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Stitching:</dt>
                    <dd className="text-zinc-200 font-medium">{formatOptionLabel(interior.stitching || "—")}</dd>
                  </div>
                </dl>

                {/* Compatibility Warnings */}
                {warnings.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300">
                    {warnings.map((w, wIdx) => (
                      <p key={wIdx}>&bull; {w}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Selection Button */}
              <div className="pt-4 mt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => onSelectProposal(proposal)}
                  className={`w-full py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
                    isSelected
                      ? "bg-white/10 text-zinc-300 cursor-default"
                      : "bg-[#C5A059] text-black hover:bg-[#D4AF37] font-bold shadow-md"
                  }`}
                >
                  {isSelected ? "Currently Selected" : "Select & Refine"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

