export const STAGES = [
  { value: "nye", label: "Nye Leads", color: "#3987e5" },
  { value: "under_arbeid", label: "Under arbeid", color: "#d95926" },
  { value: "for_oppfolging", label: "For oppfølging", color: "#199e70" },
  { value: "kunde_vunnet", label: "Kunde vunnet", color: "#c98500" },
  { value: "bil_levert", label: "Bil levert", color: "#d55181" },
  { value: "ferdig", label: "Ferdig", color: "#008300" },
] as const;

export function stageColor(stage: string) {
  return STAGES.find((s) => s.value === stage)?.color ?? "#898781";
}

export type Stage = (typeof STAGES)[number]["value"];

export function stageLabel(stage: string) {
  return STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  lost: "Tapt",
};

export const IKKE_AKTUELT_REASONS = [
  "Ingen kontakt",
  "Feil kontaktinformasjon",
  "Konkurrent",
  "Ikke finansiering",
  "Kun informasjon",
  "Annet",
] as const;

export const KUNDE_AVSLATT_REASONS = [
  "Pris",
  "Leveringstid",
  "Valgte annet merke",
  "Finansiering",
  "Ombestemte seg",
  "Ingen respons",
  "Annet",
] as const;

export const BRAND_HINTS: Record<string, string> = {
  Ford: "Husk å booke kunden inn i TDS på riktig modell.",
  Renault: "Denne lokasjonen følger egen bookingrutine.",
  Dacia: "Denne lokasjonen følger egen bookingrutine.",
  Alpine: "Denne lokasjonen følger egen bookingrutine.",
};
