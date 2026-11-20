"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Mounts one Lenis instance, drives it from a single rAF loop and cleans everything up. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = anchor?.getAttribute("href");
      if (!anchor || !hash || hash === "#") return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.6 });
      history.replaceState(null, "", hash);
    };
    const onLock = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail) lenis.stop();
      else lenis.start();
    };

    document.addEventListener("click", onClick);
    window.addEventListener("pagani:scroll-lock", onLock);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      window.removeEventListener("pagani:scroll-lock", onLock);
      lenis.destroy();
    };
  }, []);

  return null;
}
