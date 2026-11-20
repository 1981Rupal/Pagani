"use client";

import { useEffect, useRef, useState } from "react";
import { getEngine, IDLE_RPM, LIMIT_RPM, PEAK_POWER_RPM } from "../audio/engineSynth";
import { actions, useExperience } from "../store";
import { UI } from "../scene/palette";

const TACH_MAX = 7000;
const HOLD_MS = 650;

/**
 * Hold to start, hold to rev. Design.md §7: sound only after a gesture,
 * one engine at a time, one global mute (in the top bar).
 */
export function EngineConsole() {
  const engineOn = useExperience((s) => s.engineOn);
  const muted = useExperience((s) => s.muted);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const rpmRef = useRef<HTMLSpanElement>(null);
  const hzRef = useRef<HTMLSpanElement>(null);
  const tachRef = useRef<SVGRectElement>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => getEngine().setMuted(muted), [muted]);

  // Telemetry → DOM directly; no React render per frame.
  useEffect(() => {
    const engine = getEngine();
    const off = engine.onTelemetry((t) => {
      if (rpmRef.current) rpmRef.current.textContent = Math.round(t.rpm).toLocaleString("en-GB");
      if (hzRef.current) hzRef.current.textContent = Math.round(t.firingHz).toString();
      if (tachRef.current) tachRef.current.setAttribute("width", `${Math.min(1, t.rpm / TACH_MAX) * 100}%`);
      if (!t.running) actions.setEngineOn(false);
      drawScope(scopeRef.current, engine.analyserNode);
    });
    return () => {
      off();
    };
  }, []);

  const beginHold = () => {
    if (engineOn) return;
    setHolding(true);
    holdTimer.current = window.setTimeout(async () => {
      setHolding(false);
      await getEngine().start();
      actions.setEngineOn(true);
    }, HOLD_MS);
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const rev = (v: number) => getEngine().setThrottle(v);

  return (
    <section aria-label="Engine sound" className="border border-rule bg-panel p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-label text-accent">The V12 · synthesised</p>
        <p className="font-mono text-[11px] uppercase tracking-label text-muted" aria-live="polite">
          {engineOn ? "Running" : "Off"}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-px bg-rule">
        <div className="bg-panel py-2 pr-2">
          <p className="font-mono text-[11px] uppercase tracking-label text-muted">rpm</p>
          <p className="font-mono text-xl text-scienza-metal tabular-nums">
            <span ref={rpmRef}>0</span>
          </p>
        </div>
        <div className="bg-panel py-2 pl-3">
          <p className="font-mono text-[11px] uppercase tracking-label text-muted">Firing Hz</p>
          <p className="font-mono text-xl text-scienza-metal tabular-nums">
            <span ref={hzRef}>0</span>
          </p>
        </div>
      </div>

      <svg className="mt-3 block h-5 w-full" aria-hidden="true">
        <rect x="0" y="6" width="100%" height="6" fill={UI.rule} />
        <rect ref={tachRef} x="0" y="6" width="0%" height="6" fill={UI.metal} />
        <line
          x1={`${(PEAK_POWER_RPM / TACH_MAX) * 100}%`}
          x2={`${(PEAK_POWER_RPM / TACH_MAX) * 100}%`}
          y1="2"
          y2="16"
          stroke={UI.accent}
          strokeWidth="2"
        />
        <line
          x1={`${(LIMIT_RPM / TACH_MAX) * 100}%`}
          x2={`${(LIMIT_RPM / TACH_MAX) * 100}%`}
          y1="4"
          y2="14"
          stroke={UI.muted}
          strokeWidth="1"
        />
        <line
          x1={`${(IDLE_RPM / TACH_MAX) * 100}%`}
          x2={`${(IDLE_RPM / TACH_MAX) * 100}%`}
          y1="4"
          y2="14"
          stroke={UI.muted}
          strokeWidth="1"
        />
      </svg>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-muted">
        <span className="text-accent">|</span> Peak power 6,000 rpm
      </p>
      <canvas ref={scopeRef} width={560} height={96} className="mt-3 block h-12 w-full" aria-hidden="true" />

      <div className="mt-3 flex gap-2">
        {engineOn ? (
          <button
            type="button"
            onClick={() => getEngine().stop()}
            className="h-11 flex-1 border border-scienza-metal px-3 text-sm tracking-[0.04em] text-fg transition-colors duration-150 hover:bg-scienza-rule"
          >
            Switch off
          </button>
        ) : (
          <button
            type="button"
            onPointerDown={beginHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                beginHold();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") cancelHold();
            }}
            className="relative h-11 flex-1 overflow-hidden border border-scienza-metal px-3 text-sm tracking-[0.04em] text-fg select-none"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-scienza-rule"
              style={{ width: holding ? "100%" : "0%", transition: holding ? `width ${HOLD_MS}ms linear` : "none" }}
            />
            <span className="relative">Hold to start</span>
          </button>
        )}
        <button
          type="button"
          disabled={!engineOn}
          onPointerDown={() => rev(1)}
          onPointerUp={() => rev(0)}
          onPointerLeave={() => rev(0)}
          onPointerCancel={() => rev(0)}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              rev(1);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") rev(0);
          }}
          className="h-11 flex-1 border border-scienza-metal px-3 text-sm tracking-[0.04em] text-fg transition-colors duration-150 select-none hover:bg-scienza-rule disabled:cursor-not-allowed disabled:border-rule disabled:text-muted disabled:hover:bg-transparent"
        >
          Hold to rev
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Pitch = firing frequency = rpm ÷ 10. Synthesised from that physics, not a recording.
      </p>
    </section>
  );
}

const scratch = new Uint8Array(2048);

function drawScope(canvas: HTMLCanvasElement | null, analyser: AnalyserNode | null) {
  if (!canvas || !analyser) return;
  const g = canvas.getContext("2d");
  if (!g) return;
  const n = analyser.fftSize;
  analyser.getByteTimeDomainData(scratch.subarray(0, n));
  const { width: w, height: h } = canvas;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = UI.rule;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, h / 2);
  g.lineTo(w, h / 2);
  g.stroke();
  g.strokeStyle = UI.metal;
  g.lineWidth = 2;
  g.beginPath();
  const step = n / w;
  for (let x = 0; x < w; x++) {
    const v = scratch[Math.floor(x * step)] / 128 - 1;
    const y = h / 2 + v * (h / 2) * 0.9;
    if (x === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}
