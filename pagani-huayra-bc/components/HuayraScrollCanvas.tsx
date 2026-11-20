"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { clamp } from "@/lib/utils";

interface Props {
  progress: MotionValue<number>;
  frameCount: number;
  framePath: (frame: number) => string;
  onLoadProgress: (percent: number) => void;
  onReady: () => void;
}

const CONCURRENCY = 8;

/**
 * Sticky full-bleed canvas. Frames are preloaded once into reused Image objects;
 * the canvas redraws only when the rounded frame index changes, using
 * contain-fit so the car is never cropped.
 */
export default function HuayraScrollCanvas({ progress, frameCount, framePath, onLoadProgress, onReady }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cbRef = useRef({ onLoadProgress, onReady, framePath });
  cbRef.current = { onLoadProgress, onReady, framePath };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let cancelled = false;
    let ready = false;
    let lastFrame = -1;
    let drawRaf = 0;
    let width = 0;
    let height = 0;
    const images: HTMLImageElement[] = new Array(frameCount);

    const draw = (force: boolean) => {
      if (!ready || width === 0) return;
      const index = clamp(Math.round(progress.get() * (frameCount - 1)), 0, frameCount - 1);
      if (!force && index === lastFrame) return;
      const img = images[index];
      if (!img || !img.naturalWidth) return;
      lastFrame = index;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      draw(true);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();

    const unsubscribe = progress.on("change", () => {
      if (drawRaf) return;
      drawRaf = requestAnimationFrame(() => {
        drawRaf = 0;
        draw(false);
      });
    });

    let loaded = 0;
    let next = 0;
    const settle = () => {
      if (cancelled) return;
      loaded += 1;
      cbRef.current.onLoadProgress(Math.round((loaded / frameCount) * 100));
      if (loaded === frameCount) {
        ready = true;
        draw(true);
        cbRef.current.onReady();
      } else {
        pump();
      }
    };
    const pump = () => {
      if (cancelled || next >= frameCount) return;
      const i = next++;
      const img = new Image();
      img.decoding = "async";
      images[i] = img;
      img.onload = () => {
        (img.decode ? img.decode() : Promise.resolve()).catch(() => undefined).finally(settle);
      };
      img.onerror = settle;
      img.src = cbRef.current.framePath(i + 1);
    };
    for (let k = 0; k < CONCURRENCY; k++) pump();

    return () => {
      cancelled = true;
      unsubscribe();
      observer.disconnect();
      if (drawRaf) cancelAnimationFrame(drawRaf);
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
    };
  }, [progress, frameCount]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Pagani Huayra BC Macchina Volante: the closed car, a slow orbit, then doors and rear deck opening to reveal the V12 engine"
        className="edge-fade block h-full w-full"
      />
    </div>
  );
}
