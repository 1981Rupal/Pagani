"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Restrained scroll-in: opacity, translateY and a touch of blur. Runs once. */
export default function Reveal({ children, className, delay = 0, y = 28 }: Props) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Thin technical line that draws itself from the left. */
export function Rule({ className, delay = 0 }: { className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`h-px origin-left bg-line ${className ?? ""}`}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.4, ease: EASE, delay }}
    />
  );
}
