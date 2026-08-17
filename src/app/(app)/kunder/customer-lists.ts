export const CUSTOMER_LISTS = [
  { value: "alle", label: "Alle kunder" },
  { value: "vunnet", label: "Vunnet" },
  { value: "tapt-finansiering", label: "Tapt – Ikke finansiering" },
  { value: "tapt-konkurrent", label: "Tapt – Konkurrent" },
] as const;

export type CustomerListKey = (typeof CUSTOMER_LISTS)[number]["value"];
