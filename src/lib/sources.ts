export const KNOWN_SOURCES = [
  {
    key: "Nettside",
    label: "Nettside (skjema-API)",
    description: "Leads fra kundens nettside via /api/leads/ingest.",
    connected: true,
  },
  {
    key: "Facebook Lead Ads",
    label: "Facebook Lead Ads",
    description: "Krever egen integrasjon (Meta Graph API) eller bro via Zapier/Make.",
    connected: false,
  },
  {
    key: "Google Ads",
    label: "Google Ads (Lead Form Extensions)",
    description: "Krever egen integrasjon eller bro via Zapier/Make.",
    connected: false,
  },
  {
    key: "Snapchat Lead Ads",
    label: "Snapchat Lead Ads",
    description: "Krever egen integrasjon eller bro via Zapier/Make.",
    connected: false,
  },
] as const;
