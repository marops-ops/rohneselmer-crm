export type SlaState = "green" | "yellow" | "red" | "done" | "inactive";

export type SlaInfo = {
  state: SlaState;
  label: string;
  minutesRemaining: number | null;
};

const KONTAKT_SLA_MINUTES = 4 * 60;
const KONTAKT_WARNING_MINUTES = 60;
const BEHANDLING_SLA_MINUTES = 60;
const BEHANDLING_WARNING_MINUTES = 15;

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
}

/** Kontakt-SLA: 4 timer fra lead mottatt til kontaktutfall er registrert. */
export function kontaktSla(receivedAt: Date, contactOutcomeAt: Date | null, now: Date): SlaInfo {
  if (contactOutcomeAt) {
    return { state: "done", label: "Kontaktet", minutesRemaining: null };
  }
  const elapsed = minutesBetween(receivedAt, now);
  const remaining = KONTAKT_SLA_MINUTES - elapsed;

  if (remaining <= 0) {
    return { state: "red", label: "Kontakt-SLA brutt", minutesRemaining: remaining };
  }
  if (remaining <= KONTAKT_WARNING_MINUTES) {
    return {
      state: "yellow",
      label: `${Math.ceil(remaining)} min igjen (kontakt)`,
      minutesRemaining: remaining,
    };
  }
  return {
    state: "green",
    label: `${Math.ceil(remaining / 60)} t igjen (kontakt)`,
    minutesRemaining: remaining,
  };
}

/** Behandlingsfrist: 1 time fra lead akseptert til utfall er registrert. */
export function behandlingsfrist(
  acceptedAt: Date | null,
  handlingOutcomeAt: Date | null,
  now: Date
): SlaInfo {
  if (!acceptedAt) {
    return { state: "inactive", label: "Ikke akseptert", minutesRemaining: null };
  }
  if (handlingOutcomeAt) {
    return { state: "done", label: "Behandlet", minutesRemaining: null };
  }
  const elapsed = minutesBetween(acceptedAt, now);
  const remaining = BEHANDLING_SLA_MINUTES - elapsed;

  if (remaining <= 0) {
    return { state: "red", label: "Behandlingsfrist brutt", minutesRemaining: remaining };
  }
  if (remaining <= BEHANDLING_WARNING_MINUTES) {
    return {
      state: "yellow",
      label: `${Math.ceil(remaining)} min igjen (behandling)`,
      minutesRemaining: remaining,
    };
  }
  return {
    state: "green",
    label: `${Math.ceil(remaining)} min igjen (behandling)`,
    minutesRemaining: remaining,
  };
}

export const GAMMELT_LEAD_DAYS = 4;

export function isGammeltLead(lastActivityAt: Date, now: Date) {
  return minutesBetween(lastActivityAt, now) / 60 / 24 >= GAMMELT_LEAD_DAYS;
}
