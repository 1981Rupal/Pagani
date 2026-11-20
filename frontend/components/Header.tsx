"use client";

import React from "react";
import type { Vehicle } from "@/lib/atelierApi";

type Props = {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  activeTab: "ai" | "manual";
  onTabChange: (tab: "ai" | "manual") => void;
  backendOnline: boolean;
};

export function Header({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  activeTab,
  onTabChange,
  backendOnline,
}: Props) {
  return (
    <header className="border-b border-white/10 bg-[#0B0C0E]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Brand & Crest */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif tracking-[0.25em] text-lg font-bold text-white uppercase">
              PAGANI
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border border-[#C5A059]/40 text-[#C5A059] bg-[#C5A059]/10">
              Atelier AI
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 tracking-wider uppercase font-light">
            Bespoke Customization Studio
          </span>
        </div>

        {/* Backend Connectivity Status Badge */}
        <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-white/10 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-500"
            }`}
          />
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            {backendOnline ? "API Connected" : "Backend Offline"}
          </span>
        </div>
      </div>

      {/* Vehicle Selector & Modes */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Vehicle Selection */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-1.5">
          <label htmlFor="vehicle-select" className="text-xs text-zinc-400 uppercase tracking-wider">
            Model:
          </label>
          <select
            id="vehicle-select"
            value={selectedVehicleId}
            onChange={(e) => onSelectVehicle(e.target.value)}
            className="bg-transparent text-sm text-zinc-100 font-medium focus:outline-none cursor-pointer"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex p-0.5 bg-zinc-900 border border-white/10 rounded-lg">
          <button
            type="button"
            onClick={() => onTabChange("ai")}
            className={`px-4 py-1.5 rounded-md text-xs tracking-wider uppercase transition-all ${
              activeTab === "ai"
                ? "bg-[#C5A059] text-black font-semibold shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            AI Consultation
          </button>
          <button
            type="button"
            onClick={() => onTabChange("manual")}
            className={`px-4 py-1.5 rounded-md text-xs tracking-wider uppercase transition-all ${
              activeTab === "manual"
                ? "bg-[#C5A059] text-black font-semibold shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Manual Atelier
          </button>
        </div>
      </div>
    </header>
  );
}

