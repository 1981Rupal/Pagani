"use client";

import React, { useState } from "react";
import type { Theme, VehicleOptions, DesignBrief } from "@/lib/atelierApi";
import { demoMaterials, formatOptionLabel } from "@/lib/vehicleAssetMap";

type Props = {
  vehicleId: string;
  exteriorThemes: Theme[];
  interiorThemes: Theme[];
  vehicleOptions: VehicleOptions | null;
  onConsult: (brief: DesignBrief) => Promise<void>;
  onGenerate: (brief: DesignBrief) => Promise<void>;
  busy: boolean;
};

export function AIQuestionnaire({
  vehicleId,
  exteriorThemes,
  interiorThemes,
  vehicleOptions,
  onConsult,
  onGenerate,
  busy,
}: Props) {
  const [selectedExteriorTheme, setSelectedExteriorTheme] = useState<string>("");
  const [selectedInteriorTheme, setSelectedInteriorTheme] = useState<string>("");

  // Granular preference overrides
  const [bodyColor, setBodyColor] = useState<string>("");
  const [carbonFinish, setCarbonFinish] = useState<string>("");
  const [wheelFinish, setWheelFinish] = useState<string>("");
  const [seatMaterial, setSeatMaterial] = useState<string>("");
  const [seatColor, setSeatColor] = useState<string>("");
  const [stitching, setStitching] = useState<string>("");

  // Personal design brief
  const [prompt, setPrompt] = useState<string>("");
  const [personality, setPersonality] = useState<string>("balanced");
  const [priority, setPriority] = useState<string>("balanced");

  // Options from catalogue
  const options = vehicleOptions?.options || {};
  const bodyColors = options["exterior.body_color"] || [];
  const carbonFinishes = options["exterior.carbon_finish"] || [];
  const wheelFinishes = options["wheels.finish"] || [];
  const seatMaterials = options["interior.seat_material"] || [];
  const seatColors = options["interior.seat_color"] || [];
  const stitchings = options["interior.stitching"] || [];

  const buildBrief = (): DesignBrief => {
    // Combine explicit options into prompt text if specified
    const extraParts: string[] = [];
    if (bodyColor) extraParts.push(`exterior body color ${bodyColor}`);
    if (carbonFinish) extraParts.push(`carbon finish ${carbonFinish}`);
    if (wheelFinish) extraParts.push(`wheel finish ${wheelFinish}`);
    if (seatMaterial) extraParts.push(`seat material ${seatMaterial}`);
    if (seatColor) extraParts.push(`seat color ${seatColor}`);
    if (stitching) extraParts.push(`stitching ${stitching}`);

    const combinedPrompt = [prompt, extraParts.join(", ")].filter(Boolean).join(". ");

    return {
      vehicle_id: vehicleId,
      exterior_theme_id: selectedExteriorTheme || undefined,
      interior_theme_id: selectedInteriorTheme || undefined,
      personality: personality || "balanced",
      priority: priority || "balanced",
      custom_prompt: combinedPrompt,
    };
  };

  const handleConsult = async () => {
    await onConsult(buildBrief());
  };

  const handleGenerate = async () => {
    await onGenerate(buildBrief());
  };

  return (
    <div className="space-y-8 bg-zinc-950/80 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-md">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            Stage 01
          </span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-xs uppercase tracking-wider text-zinc-400">Design Brief</span>
        </div>
        <h2 className="text-2xl font-serif text-white tracking-wide">
          AI Design Consultation
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Express your vision through curated Pagani themes, individual material preferences,
          or natural language instructions. The AI Atelier will interpret your brief and generate three validated proposals.
        </p>
      </div>

      {/* Exterior Themes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            Exterior Curated Themes ({exteriorThemes.length})
          </h3>
          {selectedExteriorTheme && (
            <button
              type="button"
              onClick={() => setSelectedExteriorTheme("")}
              className="text-[11px] text-[#C5A059] hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exteriorThemes.map((theme) => {
            const isSelected = selectedExteriorTheme === theme.id;
            const primaryColor = theme.values["exterior.body_color"];
            const wheelColor = theme.values["wheels.finish"];
            return (
              <div
                key={theme.id}
                onClick={() => setSelectedExteriorTheme(isSelected ? "" : theme.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-[#C5A059]/10 border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.15)]"
                    : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{theme.name}</span>
                    {/* Color Swatch Dot */}
                    <div className="flex items-center gap-1">
                      {primaryColor && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: demoMaterials[primaryColor] || "#333" }}
                          title={formatOptionLabel(primaryColor)}
                        />
                      )}
                      {wheelColor && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: demoMaterials[wheelColor] || "#666" }}
                          title={formatOptionLabel(wheelColor)}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059]">
                  {isSelected ? "Selected" : "Select Theme"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interior Themes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            Cockpit &amp; Interior Themes ({interiorThemes.length})
          </h3>
          {selectedInteriorTheme && (
            <button
              type="button"
              onClick={() => setSelectedInteriorTheme("")}
              className="text-[11px] text-[#C5A059] hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {interiorThemes.map((theme) => {
            const isSelected = selectedInteriorTheme === theme.id;
            const seatColorVal = theme.values["interior.seat_color"];
            const stitchColorVal = theme.values["interior.stitching"];
            return (
              <div
                key={theme.id}
                onClick={() => setSelectedInteriorTheme(isSelected ? "" : theme.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-[#C5A059]/10 border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.15)]"
                    : "bg-zinc-900/60 border-white/5 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{theme.name}</span>
                    <div className="flex items-center gap-1">
                      {seatColorVal && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: demoMaterials[seatColorVal] || "#333" }}
                          title={formatOptionLabel(seatColorVal)}
                        />
                      )}
                      {stitchColorVal && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: demoMaterials[stitchColorVal] || "#666" }}
                          title={`Stitching: ${formatOptionLabel(stitchColorVal)}`}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059]">
                  {isSelected ? "Selected" : "Select Theme"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Granular Option Filters */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <h3 className="text-xs uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          Specific Component Preferences (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Body Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Body Paint Preference
            </label>
            <select
              value={bodyColor}
              onChange={(e) => setBodyColor(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="">Theme default / AI choice</option>
              {bodyColors.map((c) => (
                <option key={c} value={c}>
                  {formatOptionLabel(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Carbon Finish */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Exposed Carbon Finish
            </label>
            <select
              value={carbonFinish}
              onChange={(e) => setCarbonFinish(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="">Theme default / AI choice</option>
              {carbonFinishes.map((f) => (
                <option key={f} value={f}>
                  {formatOptionLabel(f)}
                </option>
              ))}
            </select>
          </div>

          {/* Wheels Finish */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Forged Wheel Finish
            </label>
            <select
              value={wheelFinish}
              onChange={(e) => setWheelFinish(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="">Theme default / AI choice</option>
              {wheelFinishes.map((w) => (
                <option key={w} value={w}>
                  {formatOptionLabel(w)}
                </option>
              ))}
            </select>
          </div>

          {/* Seat Material */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Upholstery Material
            </label>
            <select
              value={seatMaterial}
              onChange={(e) => setSeatMaterial(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="">Theme default / AI choice</option>
              {seatMaterials.map((m) => (
                <option key={m} value={m}>
                  {formatOptionLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Seat Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Seat Leather / Alcantara Color
            </label>
            <select
              value={seatColor}
              onChange={(e) => setSeatColor(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="">Theme default / AI choice</option>
              {seatColors.map((sc) => (
                <option key={sc} value={sc}>
                  {formatOptionLabel(sc)}
                </option>
              ))}
            </select>
          </div>

          {/* Stitching */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Contrast Stitching
            </label>
            <select
              value={stitching}
              onChange={(e) => setStitching(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="">Theme default / AI choice</option>
              {stitchings.map((st) => (
                <option key={st} value={st}>
                  {formatOptionLabel(st)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Free-Text Prompt & Direction Parameters */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <h3 className="text-xs uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          Personal Design Vision &amp; Narrative
        </h3>

        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
            Detailed Customer Brief (Natural Language)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. 'Inspired by Lake Como heritage: deep emerald green with exposed satin carbon, champagne gold accents, cognac leather cockpit with cream stitching, understated luxury elegance...'"
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] leading-relaxed resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Personality */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Design Personality
            </label>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="balanced">Balanced Luxury</option>
              <option value="heritage">Italian Heritage</option>
              <option value="stealth">Stealth &amp; Performance</option>
              <option value="avant_garde">Avant-Garde</option>
              <option value="refined">Refined Grand Touring</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
              Atelier Emphasis
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A059]"
            >
              <option value="balanced">Holistic Harmony (50/50)</option>
              <option value="exterior">Exterior Aerodynamics &amp; Paint</option>
              <option value="interior">Cockpit Materiality &amp; Tactility</option>
            </select>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={handleConsult}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-white/20 text-xs uppercase tracking-wider font-semibold text-zinc-200 hover:text-white hover:border-[#C5A059] transition-all disabled:opacity-50"
        >
          {busy ? "Analyzing..." : "Analyze Brief (Consult)"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handleGenerate}
          className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-[#C5A059] text-black text-xs uppercase tracking-wider font-bold hover:bg-[#D4AF37] transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] disabled:opacity-50"
        >
          {busy ? "Crafting Proposals..." : "Generate 3 AI Proposals"}
        </button>
      </div>
    </div>
  );
}

