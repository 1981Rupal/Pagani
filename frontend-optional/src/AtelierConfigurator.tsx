import { useState } from "react";
import { atelierApi, type DesignBrief } from "./atelierApi";

type Props = { vehicleId: string; onProposalSelected?: (proposal: any) => void };

/** Optional embeddable AI consultation panel. Style it to match the host website. */
export function AtelierConfigurator({ vehicleId, onProposalSelected }: Props) {
  const [themes, setThemes] = useState<any>(null);
  const [exterior, setExterior] = useState("");
  const [interior, setInterior] = useState("");
  const [prompt, setPrompt] = useState("");
  const [proposals, setProposals] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadThemes() {
    try { setThemes(await atelierApi.themes(vehicleId)); }
    catch (e) { setError(String(e)); }
  }

  async function generate() {
    setBusy(true); setError("");
    try {
      const brief: DesignBrief = {
        vehicle_id: vehicleId,
        exterior_theme_id: exterior || undefined,
        interior_theme_id: interior || undefined,
        custom_prompt: prompt,
      };
      const result = await atelierApi.generate(brief);
      setProposals(result.proposals ?? []);
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  }

  return <section className="atelier-panel">
    <h2>AI Atelier</h2>
    {!themes && <button onClick={loadThemes}>Load design themes</button>}
    {themes && <>
      <label>Exterior theme
        <select value={exterior} onChange={e => setExterior(e.target.value)}>
          <option value="">Choose a theme</option>
          {themes.exterior.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <label>Interior theme
        <select value={interior} onChange={e => setInterior(e.target.value)}>
          <option value="">Choose a theme</option>
          {themes.interior.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <label>Your detailed design vision
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe colours, materials, finishes and inspiration..." />
      </label>
      <button disabled={busy} onClick={generate}>{busy ? "Creating concepts..." : "Generate concepts"}</button>
    </>}
    {error && <p role="alert">{error}</p>}
    <div className="atelier-proposals">
      {proposals.map(p => <article key={p.id}>
        <h3>{p.proposal_name}</h3>
        <pre>{JSON.stringify({exterior:p.exterior,wheels:p.wheels,interior:p.interior}, null, 2)}</pre>
        <button onClick={() => onProposalSelected?.(p)}>Use this configuration</button>
      </article>)}
    </div>
  </section>;
}
