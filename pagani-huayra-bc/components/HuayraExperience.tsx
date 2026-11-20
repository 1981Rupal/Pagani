"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import HuayraScrollCanvas from "./HuayraScrollCanvas";
import { carData, type Phase } from "@/data/carData";
import { EASE, cn } from "@/lib/utils";

const FADE = 0.035;

function PhaseHUD({ phase, progress, flip }: { phase: Phase; progress: MotionValue<number>; flip: boolean }) {
  const [a, b] = phase.range;
  const first = a === 0;
  const last = b === 1;
  // first: starts visible; last: stays visible; middle: fades in and out.
  const stops = first
    ? { x: [0, b - FADE, b], o: [1, 1, 0], y: [0, 0, -28] }
    : last
      ? { x: [a, a + FADE, 1], o: [0, 1, 1], y: [28, 0, 0] }
      : { x: [a, a + FADE, b - FADE, b], o: [0, 1, 1, 0], y: [28, 0, 0, -28] };

  const opacity = useTransform(progress, stops.x, stops.o);
  const y = useTransform(progress, stops.x, stops.y);
  const blurPx = useTransform(opacity, [0, 1], [10, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.div
      aria-hidden
      style={{ opacity, y, filter }}
      className={cn(
        "pointer-events-none absolute inset-0 flex flex-col justify-between px-5 pb-16 pt-24 md:px-12 md:pb-20 md:pt-28",
        flip && "md:items-end md:text-right",
      )}
    >
      <div className="max-w-[44rem]">
        <p className="font-display text-xs font-semibold tracking-[0.3em] text-red md:text-sm">
          {phase.index} / {phase.name}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.9rem,5.4vw,4.75rem)] font-black leading-[0.95] tracking-tight text-ink">
          {phase.title}
        </h2>
        {phase.subtitle && (
          <p className="mt-3 font-display text-[0.7rem] font-medium tracking-[0.28em] text-steel md:text-sm">
            {phase.subtitle}
          </p>
        )}
        {phase.tagline && <p className="mt-4 text-xl font-medium italic text-ink md:text-2xl">“{phase.tagline}”</p>}
      </div>
      <div className={cn("flex flex-wrap gap-x-12 gap-y-4 border-t border-line pt-5", flip && "md:justify-end")}>
        {phase.stats.map((s, i) => (
          <div key={s.label}>
            <p className={cn("font-display text-[clamp(1.35rem,3vw,2.6rem)] font-bold leading-none", i === 0 ? "text-red" : "text-ink")}>
              {s.value}
            </p>
            <p className="mt-2 text-sm font-semibold tracking-[0.18em] text-steel">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function LoadingScreen({ percent }: { percent: number }) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6 text-center"
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <p className="font-display text-[clamp(2.25rem,8vw,5rem)] font-black tracking-[0.28em] text-ink">PAGANI</p>
      <p className="mt-3 font-display text-xs font-semibold tracking-[0.5em] text-red md:text-sm">HUAYRA BC</p>
      <div className="mt-14 h-px w-48 bg-line md:w-64">
        <div className="h-full origin-left bg-red transition-transform duration-300 ease-out" style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <p className="mt-5 font-display text-xs font-medium tracking-[0.35em] text-steel">
        LOADING <span className="inline-block min-w-[3ch] text-right text-ink">{percent}</span>%
      </p>
    </motion.div>
  );
}

export default function HuayraExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const [percent, setPercent] = useState(0);
  const [ready, setReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const frameLabel = useTransform(scrollYProgress, (v) =>
    String(Math.round(v * (carData.frames.count - 1)) + 1).padStart(3, "0"),
  );
  const cueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

  useEffect(() => {
    document.documentElement.classList.add("is-loading");
    window.dispatchEvent(new CustomEvent("pagani:scroll-lock", { detail: true }));
    return () => document.documentElement.classList.remove("is-loading");
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
    document.documentElement.classList.remove("is-loading");
    window.dispatchEvent(new CustomEvent("pagani:scroll-lock", { detail: false }));
  }, []);
  const framePath = useCallback((n: number) => `${carData.frames.path}/${n}.jpg`, []);

  return (
    <>
      <AnimatePresence>{!ready && <LoadingScreen percent={percent} />}</AnimatePresence>

      <section id="top" ref={sectionRef} className="relative h-[600vh]" aria-label="Pagani Huayra BC Macchina Volante">
        <h1 className="sr-only">
          Pagani Huayra BC Macchina Volante. {carData.phases.map((p) => `${p.title}. ${p.subtitle ?? ""}.`).join(" ")}
        </h1>
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-white [height:100svh]">
          <HuayraScrollCanvas
            progress={scrollYProgress}
            frameCount={carData.frames.count}
            framePath={framePath}
            onLoadProgress={setPercent}
            onReady={handleReady}
          />

          {carData.phases.map((phase, i) => (
            <PhaseHUD key={phase.id} phase={phase} progress={scrollYProgress} flip={i % 2 === 1} />
          ))}

          <motion.div
            aria-hidden
            style={{ opacity: cueOpacity }}
            className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-display text-[0.65rem] font-semibold tracking-[0.4em] text-steel md:flex"
          >
            SCROLL <span className="block h-px w-10 bg-red" />
          </motion.div>

          <div aria-hidden className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center gap-4 md:inset-x-12 md:bottom-7">
            <span className="font-display text-[0.65rem] font-semibold tracking-[0.25em] text-ink">
              <motion.span>{frameLabel}</motion.span>
              <span className="text-steel"> / {carData.frames.count}</span>
            </span>
            <div className="h-px flex-1 bg-line">
              <motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-red" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
