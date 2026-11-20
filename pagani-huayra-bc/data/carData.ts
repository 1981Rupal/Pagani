export interface NavItem { label: string; href: string }
export interface Stat { value: string; label: string }
export interface Phase {
  id: string;
  index: string;
  name: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  stats: Stat[];
  /** Portion of the hero scrollYProgress (0–1) in which this phase is shown. */
  range: readonly [number, number];
}
export interface Spec { label: string; value: string }
export interface Feature { title: string; text: string }

export const carData = {
  brand: { name: "PAGANI", maker: "AUTOMOBILI S.P.A.", city: "MODENA", country: "ITALY" },
  model: "HUAYRA BC",
  edition: "MACCHINA VOLANTE",
  year: 2017,
  price: "€2,600,000",
  units: 20,
  origin: "MODENA, ITALY",
  copyright: "© 2026",

  navigation: [
    { label: "STORY", href: "#story" },
    { label: "DESIGN", href: "#design" },
    { label: "ENGINEERING", href: "#engineering" },
    { label: "SPECS", href: "#specs" },
  ] satisfies NavItem[],
  inquire: { label: "INQUIRE", href: "#inquire" } satisfies NavItem,

  frames: { count: 240, path: "/images/huayra-sequence" },

  // Ranges are tuned to the supplied footage: closed car → orbit → doors → hood → V12.
  phases: [
    {
      id: "origin", index: "01", name: "ORIGIN", title: "HUAYRA BC",
      subtitle: "MACCHINA VOLANTE", tagline: "The Flying Machine",
      stats: [{ value: "20", label: "UNITS PRODUCED WORLDWIDE" }, { value: "€2,600,000", label: "PRICE" }],
      range: [0, 0.22],
    },
    {
      id: "form", index: "02", name: "FORM", title: "CARBON SCULPTURE",
      subtitle: "AERODYNAMIC MASTERY",
      stats: [{ value: "CARBOTANIUM™", label: "MATERIAL" }],
      range: [0.22, 0.6],
    },
    {
      id: "ritual", index: "03", name: "RITUAL", title: "BUTTERFLY DOORS",
      subtitle: "THE THEATRE OF ENTRY",
      stats: [{ value: "73°", label: "DOOR OPENING" }],
      range: [0.6, 0.84],
    },
    {
      id: "power", index: "04", name: "POWER", title: "AMG V12 BITURBO",
      subtitle: "745 HP / 1,000 NM",
      stats: [{ value: "2.8 SEC", label: "0–100 KM/H" }],
      range: [0.84, 1],
    },
  ] satisfies Phase[],

  story: {
    title: ["BORN FROM", "WIND."],
    text: "A flying machine, conceived and built by hand in Modena. Twenty cars, no more.",
    facts: [
      { label: "MODEL", value: "HUAYRA BC" },
      { label: "ORIGIN", value: "MODENA, ITALY" },
      { label: "YEAR", value: "2017" },
      { label: "PRODUCTION", value: "20 UNITS" },
    ],
  },

  design: {
    kicker: "CARBON SCULPTURE",
    title: "FORM FOLLOWS PERFORMANCE.",
    items: [
      { title: "CARBOTANIUM", text: "A material of carbon fiber and titanium." },
      { title: "AERODYNAMIC SURFACES", text: "Every surface shaped by the air that crosses it." },
      { title: "ACTIVE AERODYNAMICS", text: "Aerodynamics that work while the car moves." },
      { title: "CARBON FIBER AND TITANIUM", text: "The two materials that define the body." },
    ] satisfies Feature[],
  },

  engineering: {
    title: "ENGINEERED WITHOUT COMPROMISE.",
    engine: "V12 BITURBO",
    figures: [
      { value: "6.0", unit: "LITRES" },
      { value: "745", unit: "HP" },
      { value: "1,000", unit: "NM" },
    ],
  },

  specifications: [
    { label: "ENGINE", value: "V12 BITURBO AMG" },
    { label: "DISPLACEMENT", value: "6.0 LITRES" },
    { label: "POWER", value: "745 HP" },
    { label: "TORQUE", value: "1,000 NM" },
    { label: "WEIGHT", value: "1,218 KG" },
    { label: "TOP SPEED", value: "380 KM/H" },
    { label: "0–100 KM/H", value: "2.8 SEC" },
    { label: "UNITS BUILT", value: "20 TOTAL" },
  ] satisfies Spec[],

  craftsmanship: {
    title: "THE HUMAN HAND.",
    facts: [
      { label: "HAND ASSEMBLED", value: "Every car, by hand." },
      { label: "MODENA, ITALY", value: "Built where it was imagined." },
      { label: "20 CARS", value: "A single, closed series." },
      { label: "BESPOKE INTERIOR", value: "Finished to the owner." },
    ],
  },

  features: [
    { title: "CARBOTANIUM BODY", text: "Carbon fiber and titanium, woven into the structure of the car." },
    { title: "ACTIVE AERODYNAMICS", text: "Surfaces that respond to the way the car is driven." },
    { title: "BESPOKE RED INTERIOR", text: "A cabin finished to the owner’s specification." },
    { title: "TRACK DNA", text: "Engineering inherited from the circuit." },
  ] satisfies Feature[],

  cta: {
    title: ["THE ART OF", "PERFORMANCE."],
    model: "HUAYRA BC",
    primary: { label: "INQUIRE ABOUT THE HUAYRA BC", href: "#contact" },
    secondary: { label: "EXPLORE PAGANI", href: "https://www.pagani.com" },
  },

  footer: {
    links: [
      { label: "STORY", href: "#story" },
      { label: "DESIGN", href: "#design" },
      { label: "ENGINEERING", href: "#engineering" },
      { label: "SPECS", href: "#specs" },
      { label: "CONTACT", href: "#contact" },
    ] satisfies NavItem[],
  },
} as const;

export type CarData = typeof carData;
