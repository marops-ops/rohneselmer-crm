export const BRANDS = ["Ford", "Renault", "Dacia", "Alpine"] as const;
export type VehicleBrand = (typeof BRANDS)[number];

export const MODELS_BY_BRAND: Record<VehicleBrand, string[]> = {
  Ford: [
    "Puma",
    "Explorer",
    "Capri",
    "Mustang Mach-E",
    "Mustang Mach-E Rally",
    "Mustang GTD",
    "Mustang GT",
    "F-150 Lightning",
    "Tourneo Custom",
    "E-Transit Courier",
    "Transit Courier",
    "Transit Connect",
    "E-Transit Custom",
    "Transit Custom",
    "Transit Custom MS-RT",
    "Transit Chassis Cab",
    "E-Transit",
    "Transit",
    "Transit Minibuss",
    "Ranger ladbar hybrid",
    "Ranger",
    "Ranger Raptor",
    "Ranger MS-RT",
    "Transit City",
  ],
  Renault: ["Captur", "Austral", "Clio"],
  Dacia: ["Duster", "Sandero"],
  Alpine: ["A290"],
};

export function isKnownBrand(value: string): value is VehicleBrand {
  return (BRANDS as readonly string[]).includes(value);
}
