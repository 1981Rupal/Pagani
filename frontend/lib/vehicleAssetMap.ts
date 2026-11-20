/**
 * Vehicle mesh and material mapping.
 * Replace mesh/material names below with names from your licensed GLB/GLTF asset.
 * A model without separate material slots must be prepared in Blender first.
 */
export const vehicleAssetMap = {
  exterior: {
    body_color: ["Body_Paint", "Bonnet_Paint", "Door_Paint", "Rear_Paint", "Roof_Paint"],
    carbon_finish: ["Carbon_Exterior", "Splitter_Carbon", "Diffuser_Carbon", "Wing_Carbon"],
  },
  wheels: {
    finish: ["Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR", "Rim_Front", "Rim_Rear"],
    caliper: ["Caliper_FL", "Caliper_FR", "Caliper_RL", "Caliper_RR"],
  },
  interior: {
    seat_color: ["Seat_Driver", "Seat_Passenger", "Seat_Cushions"],
    seat_material: ["Seat_Base", "Interior_Trim"],
    stitching: ["Seat_Stitching", "Dash_Stitching", "Door_Stitching"],
  },
} as const;

export const demoMaterials: Record<string, string> = {
  // Exterior body colors
  emerald_green: "#075E43",
  midnight_blue: "#101D45",
  obsidian_black: "#101014",
  pearl_white: "#E8E5DC",
  burgundy: "#54182C",

  // Carbon finishes (subtle reflectivity / tone differentiation)
  exposed_dark: "#1A1A1E",
  satin_dark: "#2A2A30",
  gloss_dark: "#0F0F12",

  // Wheels
  champagne_gold: "#B69A62",
  gloss_black: "#101014",
  polished_silver: "#B8BCC2",
  dark_titanium: "#44464B",

  // Interior seats & leathers
  tan: "#A66F42",
  black: "#171717",
  ivory: "#E8DDC5",
  cognac: "#8A4F2D",
  leather: "#2B2118",
  alcantara: "#1E1E22",

  // Stitching
  cream: "#D9C9A8",
  brown: "#65452F",
  gold: "#B69A62",
  red: "#8F2026",
};

/**
 * Friendly label helper for display
 */
export function formatOptionLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

