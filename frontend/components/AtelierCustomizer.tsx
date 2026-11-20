"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  atelierApi,
  type Vehicle,
  type VehicleOptions,
  type Theme,
  type VehicleConfiguration,
  type DesignBrief,
} from "@/lib/atelierApi";
import { Header } from "./Header";
import { AtelierViewer } from "./AtelierViewer";
import { AIQuestionnaire } from "./AIQuestionnaire";
import { ProposalGrid } from "./ProposalGrid";
import { ManualEditor } from "./ManualEditor";
import { formatOptionLabel } from "@/lib/vehicleAssetMap";

export function AtelierCustomizer() {
  // Navigation & session state
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Data from backend
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("pagani_utopia");
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOptions | null>(null);
  const [exteriorThemes, setExteriorThemes] = useState<Theme[]>([]);
  const [interiorThemes, setInteriorThemes] = useState<Theme[]>([]);

  // AI proposals and active configuration
  const [proposals, setProposals] = useState<VehicleConfiguration[]>([]);
  const [activeConfiguration, setActiveConfiguration] = useState<VehicleConfiguration | null>(null);
  const [proposalNote, setProposalNote] = useState<string>("");
  const [patchWarnings, setPatchWarnings] = useState<string[]>([]);

  // History stack for Undo / Redo in manual editor
  const [history, setHistory] = useState<VehicleConfiguration[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Initialize and check backend
  const loadInitialData = useCallback(async (vId: string) => {
    setLoadingInitial(true);
    setErrorMessage("");
    try {
      // 1. Health check
      try {
        await atelierApi.health();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }

      // 2. Load Vehicles
      const vList = await atelierApi.vehicles();
      setVehicles(vList);
      const currentId = vList.some((v) => v.id === vId) ? vId : vList[0]?.id || "pagani_utopia";
      setSelectedVehicleId(currentId);

      // 3. Load Options and Themes in parallel
      const [opts, themesResp] = await Promise.all([
        atelierApi.options(currentId),
        atelierApi.themes(currentId),
      ]);
      setVehicleOptions(opts);
      setExteriorThemes(themesResp.exterior || []);
      setInteriorThemes(themesResp.interior || []);

      // 4. Create default starting baseline configuration
      const defaultTheme = themesResp.exterior?.[0];
      const defaultInterior = themesResp.interior?.[0];
      const baseline: VehicleConfiguration = {
        vehicle_id: currentId,
        exterior: {
          body_color: defaultTheme?.values["exterior.body_color"] || "emerald_green",
          carbon_finish: defaultTheme?.values["exterior.carbon_finish"] || "exposed_dark",
        },
        wheels: {
          finish: defaultTheme?.values["wheels.finish"] || "champagne_gold",
          design: opts.options["wheels.design"]?.[0] || "approved_wheel_01",
        },
        interior: {
          seat_material: defaultInterior?.values["interior.seat_material"] || "leather",
          seat_color: defaultInterior?.values["interior.seat_color"] || "tan",
          stitching: defaultInterior?.values["interior.stitching"] || "brown",
        },
        bespoke: {
          embroidery: "none",
        },
        proposal_name: "Atelier Baseline",
      };

      setActiveConfiguration(baseline);
      setHistory([baseline]);
      setHistoryIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load vehicle catalogue from backend.");
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData("pagani_utopia");
  }, [loadInitialData]);

  // Handle vehicle change
  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    loadInitialData(id);
  };

  // AI Consult Brief handler
  const handleConsultBrief = async (brief: DesignBrief) => {
    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await atelierApi.consult(brief);
      const config = res.interpreted_configuration;
      setActiveConfiguration(config);

      // Push to history
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), config]);
      setHistoryIndex((prev) => prev + 1);

      setSuccessMessage("Design brief successfully interpreted by Atelier AI.");
    } catch (err: any) {
      setErrorMessage(err.message || "Error analyzing brief.");
    } finally {
      setBusy(false);
    }
  };

  // AI Generate 3 Proposals handler
  const handleGenerateProposals = async (brief: DesignBrief) => {
    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await atelierApi.generate(brief, 3);
      setProposals(res.proposals || []);
      setProposalNote(res.note || "");

      if (res.proposals && res.proposals.length > 0) {
        const first = res.proposals[0];
        setActiveConfiguration(first);
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), first]);
        setHistoryIndex((prev) => prev + 1);
        setSuccessMessage(`Three bespoke configurations created. Active concept: ${first.proposal_name}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error generating proposals.");
    } finally {
      setBusy(false);
    }
  };

  // Select proposal
  const handleSelectProposal = (proposal: VehicleConfiguration) => {
    setActiveConfiguration(proposal);
    setPatchWarnings(proposal.validation_warnings || []);

    // Push into history stack
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), proposal]);
    setHistoryIndex((prev) => prev + 1);

    setSuccessMessage(`Selected concept: ${proposal.proposal_name}`);
  };

  // Manual Component Modification via backend PATCH
  const handleApplyChange = async (path: string, value: string) => {
    if (!activeConfiguration) return;

    setBusy(true);
    setErrorMessage("");
    setPatchWarnings([]);

    try {
      // If configuration already has a backend ID, call PATCH directly
      if (activeConfiguration.id) {
        const patchRes = await atelierApi.patchConfiguration(activeConfiguration.id, {
          [path]: value,
        });
        const updated = patchRes.configuration;
        setActiveConfiguration(updated);
        setPatchWarnings(patchRes.warnings || []);

        setHistory((prev) => [...prev.slice(0, historyIndex + 1), updated]);
        setHistoryIndex((prev) => prev + 1);
      } else {
        // If not saved to backend yet, generate or mock ID locally, or apply safely
        const [group, key] = path.split(".");
        const updated: VehicleConfiguration = {
          ...activeConfiguration,
          [group]: {
            ...(activeConfiguration as any)[group],
            [key]: value,
          },
        };
        setActiveConfiguration(updated);
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), updated]);
        setHistoryIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to apply ${path}: ${value}`);
    } finally {
      setBusy(false);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setActiveConfiguration(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setActiveConfiguration(history[newIdx]);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] text-zinc-100 flex flex-col font-sans selection:bg-[#C5A059] selection:text-black">
      {/* Brand & Global Header */}
      <Header
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={handleSelectVehicle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendOnline={backendOnline}
      />

      {/* Main Studio & Atelier Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Notifications / Alerts */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-4 rounded-xl flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-rose-400 font-bold ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-emerald-400 font-bold ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3D Interactive Studio Viewport (Sticky on desktop) */}
          <section className="lg:col-span-5 xl:col-span-6 lg:sticky lg:top-24 space-y-4">
            <AtelierViewer configuration={activeConfiguration} />

            {/* Quick Active Configuration Summary Card */}
            {activeConfiguration && (
              <div className="bg-zinc-950/70 border border-white/5 rounded-xl p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Paint</span>
                  <span className="text-zinc-200 font-semibold truncate block">
                    {formatOptionLabel(activeConfiguration.exterior?.body_color || "—")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Carbon</span>
                  <span className="text-zinc-200 font-semibold truncate block">
                    {formatOptionLabel(activeConfiguration.exterior?.carbon_finish || "—")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Wheels</span>
                  <span className="text-[#C5A059] font-semibold truncate block">
                    {formatOptionLabel(activeConfiguration.wheels?.finish || "—")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Upholstery</span>
                  <span className="text-zinc-200 font-semibold truncate block">
                    {formatOptionLabel(activeConfiguration.interior?.seat_color || "—")}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Interaction Hub (Tabs: AI Consultation vs Manual Atelier) */}
          <section className="lg:col-span-7 xl:col-span-6 space-y-6">
            {loadingInitial ? (
              <div className="p-16 border border-white/10 rounded-2xl bg-zinc-950/60 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs uppercase tracking-widest text-zinc-400">
                  Connecting to Pagani Atelier...
                </p>
              </div>
            ) : activeTab === "ai" ? (
              <div className="space-y-6">
                {/* Stage 1: AI Questionnaire */}
                <AIQuestionnaire
                  vehicleId={selectedVehicleId}
                  exteriorThemes={exteriorThemes}
                  interiorThemes={interiorThemes}
                  vehicleOptions={vehicleOptions}
                  onConsult={handleConsultBrief}
                  onGenerate={handleGenerateProposals}
                  busy={busy}
                />

                {/* Stage 2: Proposals Grid */}
                <ProposalGrid
                  proposals={proposals}
                  selectedConfigurationId={activeConfiguration?.id}
                  onSelectProposal={handleSelectProposal}
                  note={proposalNote}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Manual Component Customizer with PATCH integration */}
                <ManualEditor
                  configuration={activeConfiguration}
                  vehicleOptions={vehicleOptions}
                  onApplyChange={handleApplyChange}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                  busy={busy}
                  warnings={patchWarnings}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-8 text-center text-zinc-600 text-xs mt-12">
        <p className="tracking-widest uppercase">
          Pagani Automobili Atelier AI &bull; Bespoke Vehicle Specification Engine
        </p>
        <p className="text-[11px] text-zinc-600 mt-1">
          Demo vehicle profile &mdash; configurations subject to manufacturer technical validation.
        </p>
      </footer>
    </div>
  );
}

