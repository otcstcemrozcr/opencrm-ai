// Picklists for organization settings. Kept small and explicit; extend as needed.

export const CURRENCIES = ["USD", "EUR", "GBP", "TRY", "JPY", "CHF", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const TIMEZONES = [
  "UTC",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
] as const;
export type Timezone = (typeof TIMEZONES)[number];
