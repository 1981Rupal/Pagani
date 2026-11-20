/**
 * Colours for WebGL, which can't read Tailwind utilities.
 *
 * UI_* values mirror Design.md §2 Scienza tokens one-to-one; change them there
 * first. MAT_* values are *content* (paint, metals, rubber), which Design.md §2
 * rule 5 allows to be any colour.
 */
export const UI = {
  page: "#0E0F10", // scienza.page
  stage: "#121416", // scienza.stage
  panel: "#1A1C1E", // scienza.panel
  rule: "#2C2F32", // scienza.rule
  text: "#ECEAE4", // scienza.text
  muted: "#9A9C9F", // scienza.muted
  metal: "#C8CBCF", // scienza.metal
  accent: "#B88A5A", // scienza.accent
} as const;

export const MAT = {
  paintTint: "#3a5068", // blue-tinted exposed carbon, clear-coated
  carbonA: "#141618",
  carbonB: "#24272b",
  titanium: "#b7b2a8",
  aluminium: "#c9ccd0",
  steel: "#6c7176",
  engine: "#2a2c2f",
  rubber: "#131313",
  glass: "#a9bcc6",
  leather: "#7a4a2e",
  ceramic: "#47443f",
  caliper: "#8f7a5d",
  lamp: "#e9e4d6",
  tail: "#7c211b",
  floor: "#121416",
} as const;
