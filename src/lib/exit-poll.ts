import { AMBITO_PROVINCIAL, candidatosPorAmbito, type CandidatoMunicipal } from "./municipales";
import { normalize } from "./normalize";

/**
 * Election-night results shown on the home page.
 *
 * To publish an exit poll: fill `filas` for the pollster (in the order they
 * published it, or any order: rows are sorted by percentage) and redeploy.
 * The home page switches to results mode as soon as one source has rows.
 * Pollsters sometimes publish only the top 3 or 5; the list shows whatever
 * is loaded, capped at 10.
 */

export type ExitPollSourceId = "ipsos" | "datum";

export interface ExitPollRow {
  /** Name as the pollster published it; matched against the JNE roll for photo and profile link. */
  nombre: string;
  partido?: string;
  porcentaje: number;
  /** Explicit candidate slug when the published name does not match automatically. */
  slug?: string;
}

export interface ExitPollSource {
  id: ExitPollSourceId;
  nombre: string;
  /** Who commissioned or broadcast it, e.g. "América TV". */
  medio?: string;
  /** Free-text cut-off as published, e.g. "Al 100% · 5:00 p. m.". */
  corte?: string;
  /** Link to the pollster's technical sheet or original publication. */
  url?: string;
  filas: ExitPollRow[];
}

export const EXIT_POLL_AMBITO = "Lima Metropolitana";

/** Source selected when the page loads, if it has data. */
export const EXIT_POLL_DEFAULT: ExitPollSourceId = "ipsos";

export const EXIT_POLL_SOURCES: ExitPollSource[] = [
  { id: "ipsos", nombre: "Ipsos Perú", filas: [] },
  { id: "datum", nombre: "Datum Internacional", filas: [] },
];

export const EXIT_POLL_MAX_FILAS = 10;

export interface ExitPollRowView {
  nombre: string;
  partido: string | null;
  porcentaje: number;
  slug: string | null;
}

export interface ExitPollSourceView extends Omit<ExitPollSource, "filas"> {
  filas: ExitPollRowView[];
}

function matchCandidate(row: ExitPollRow, roll: CandidatoMunicipal[]): CandidatoMunicipal | null {
  if (row.slug) return roll.find((c) => c.slug === row.slug) ?? null;
  const name = normalize(row.nombre).trim();
  if (!name) return null;
  const exact = roll.find(
    (c) => normalize(c.nombre) === name || c.keywords.some((k) => normalize(k) === name)
  );
  if (exact) return exact;
  // Pollsters usually print "First Surname"; every word must appear in the JNE name.
  const words = name.split(/\s+/);
  const partial = roll.filter((c) => {
    const full = normalize(c.nombre).split(/\s+/);
    return words.every((w) => full.includes(w));
  });
  return partial.length === 1 ? partial[0] : null;
}

/** Sorts by percentage, caps at 10 and attaches JNE identity when it matches unambiguously. */
export function buildExitPollView(
  sources: ExitPollSource[] = EXIT_POLL_SOURCES,
  roll: CandidatoMunicipal[] = candidatosPorAmbito(AMBITO_PROVINCIAL)
): ExitPollSourceView[] {
  return sources
    .filter((s) => s.filas.length > 0)
    .map((s) => ({
      ...s,
      filas: [...s.filas]
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, EXIT_POLL_MAX_FILAS)
        .map((row) => {
          const match = matchCandidate(row, roll);
          return {
            nombre: row.nombre,
            partido: row.partido ?? match?.partido ?? null,
            porcentaje: row.porcentaje,
            slug: match?.slug ?? null,
          };
        }),
    }));
}

export interface ExitPollStanding {
  fuente: string;
  puesto: number;
  porcentaje: number;
}

/** Where a candidate stands in each published exit poll; empty when they are not listed. */
export function exitPollStandingFor(slug: string, view: ExitPollSourceView[] = buildExitPollView()): ExitPollStanding[] {
  return view.flatMap((s) => {
    const i = s.filas.findIndex((f) => f.slug === slug);
    return i === -1 ? [] : [{ fuente: s.nombre, puesto: i + 1, porcentaje: s.filas[i].porcentaje }];
  });
}
