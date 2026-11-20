"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { carData } from "@/data/carData";
import { EASE, cn } from "@/lib/utils";

function Monogram() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="shrink-0">
      <circle cx="17" cy="17" r="16" fill="none" stroke="#111111" strokeWidth="1.25" />
      <path d="M12 26V8h6.5a5 5 0 0 1 0 10H12" fill="none" stroke="#CC0000" strokeWidth="2.25" strokeLinecap="square" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Never release the loader's scroll lock from here.
    if (!open && document.documentElement.classList.contains("is-loading")) return;
    if (open || mountedRef.current) {
      window.dispatchEvent(new CustomEvent("pagani:scroll-lock", { detail: open }));
    }
    mountedRef.current = true;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [...carData.navigation, carData.inquire];

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open ? "border-line bg-white/80 backdrop-blur-xl" : "border-transparent bg-transparent",
        )}
      >
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[110rem] items-center justify-between px-5 md:h-20 md:px-12">
          <a href="#top" className="flex items-center gap-3" aria-label="Pagani Huayra BC, back to top">
            <Monogram />
            <span className="font-display text-[0.7rem] font-bold leading-tight tracking-[0.3em] text-ink md:text-xs">
              {carData.brand.name}
              <span className="block font-medium text-red">{carData.model}</span>
            </span>
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {carData.navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="group relative font-display text-[0.7rem] font-semibold tracking-[0.25em] text-ink">
                  {item.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-red transition-transform duration-500 ease-out group-hover:scale-x-100" />
                </a>
              </li>
            ))}
            <li>
              <a
                href={carData.inquire.href}
                className="border border-red px-5 py-2.5 font-display text-[0.7rem] font-bold tracking-[0.25em] text-red transition-colors duration-300 hover:bg-red hover:text-white"
              >
                {carData.inquire.label}
              </a>
            </li>
          </ul>

          <button
            type="button"
            className="relative h-11 w-11 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={cn("absolute left-2.5 top-[17px] h-px w-6 bg-ink transition-transform duration-500", open && "translate-y-[5px] rotate-45")} />
            <span className={cn("absolute left-2.5 top-[27px] h-px w-6 bg-ink transition-transform duration-500", open && "-translate-y-[5px] -rotate-45")} />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-center bg-white px-8 lg:hidden"
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <ul onClick={() => setOpen(false)}>
              {links.map((item, i) => (
                <motion.li
                  key={item.href}
                  className="border-b border-line"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.06 }}
                >
                  <a
                    href={item.href}
                    className={cn(
                      "block py-5 font-display text-2xl font-bold tracking-[0.12em] sm:text-3xl",
                      item.label === "INQUIRE" ? "text-red" : "text-ink",
                    )}
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <p className="mt-10 font-display text-[0.65rem] leading-relaxed tracking-[0.35em] text-steel">
              {carData.brand.name} {carData.brand.maker}
              <span className="block">{carData.origin}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
