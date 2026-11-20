/**
 * Replace mesh/material names below with names from your licensed GLB/GLTF asset.
 * This mapping is asset-specific. A model without separate material slots must be prepared first.
 */
export const vehicleAssetMap = {
  exterior: {
    body_color: ["Body_Paint", "Bonnet_Paint", "Door_Paint"],
    carbon_finish: ["Carbon_Exterior"],
  },
  wheels: {
    finish: ["Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR"],
  },
  interior: {
    seat_color: ["Seat_Driver", "Seat_Passenger"],
    stitching: ["Seat_Stitching"],
  },
} as const;

export const demoMaterials: Record<string, string> = {
  emerald_green: "#075E43",
  midnight_blue: "#101D45",
  obsidian_black: "#101014",
  pearl_white: "#E8E5DC",
  burgundy: "#54182C",
  champagne_gold: "#B69A62",
  gloss_black: "#101014",
  polished_silver: "#B8BCC2",
  dark_titanium: "#44464B",
  tan: "#A66F42",
  black: "#171717",
  ivory: "#E8DDC5",
  cognac: "#8A4F2D",
  cream: "#D9C9A8",
  brown: "#65452F",
  gold: "#B69A62",
  red: "#8F2026",
};
