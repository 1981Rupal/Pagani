/** Shared easing used by every Framer Motion transition on the site. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
