/**
 * ERM 2026 polling hours, per ONPE: Sunday 2026-10-04, 7:00 to 17:00 Peru time
 * (UTC-5, no daylight saving).
 */
export const POLLS_OPEN = Date.parse("2026-10-04T07:00:00-05:00");
export const POLLS_CLOSE = Date.parse("2026-10-04T17:00:00-05:00");

export type CountdownState =
  | { phase: "before"; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "voting"; minutesToClose: number }
  | { phase: "closed" };

/** Pure so it can be tested and rendered without depending on the real clock. */
export function getCountdownState(now: number, open = POLLS_OPEN, close = POLLS_CLOSE): CountdownState {
  if (now >= close) return { phase: "closed" };
  if (now >= open) return { phase: "voting", minutesToClose: Math.ceil((close - now) / 60_000) };

  const totalSeconds = Math.floor((open - now) / 1000);
  return {
    phase: "before",
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

/**
 * Soft, human phrasing of the time left before polls open ("en 1 día y 10 horas"),
 * with at most two units so the hero stays calm.
 */
export function describeTimeUntilOpen(state: Extract<CountdownState, { phase: "before" }>): string {
  const { days, hours, minutes } = state;
  if (days > 0) {
    return hours > 0
      ? `en ${plural(days, "día", "días")} y ${plural(hours, "hora", "horas")}`
      : `en ${plural(days, "día", "días")}`;
  }
  if (hours > 0) return `en ${plural(hours, "hora", "horas")} y ${minutes} min`;
  return minutes > 0 ? `en ${minutes} min` : "en menos de un minuto";
}
