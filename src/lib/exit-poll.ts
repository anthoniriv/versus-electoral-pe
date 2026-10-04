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
export const EXIT_POLL_DEFAULT: ExitPollSourceId = "datum";

export const EXIT_POLL_SOURCES: ExitPollSource[] = [
  { id: "ipsos", nombre: "Ipsos Perú", filas: [] },
  {
    id: "datum",
    nombre: "Datum Internacional",
    corte: "Flash electoral",
    filas: [
      // Rubio Idrogo resigned on 2026-08-04; López Aliaga (first councilor on the
      // list) heads the ticket. No slug: the JNE roll still lists Rubio's profile.
      { nombre: "Rafael López Aliaga", partido: "Renovación Popular", porcentaje: 31.2 },
      { nombre: "Francis Allison", porcentaje: 25.2 },
      { nombre: "Carlos Bruce", porcentaje: 15.9 },
      { nombre: "Daniel Urresti", porcentaje: 9.7 },
    ],
  },
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

/** Sorts by percentage, caps the list and attaches JNE identity when a name matches unambiguously. */
export function resolveRows(
  filas: ExitPollRow[],
  roll: CandidatoMunicipal[],
  max = EXIT_POLL_MAX_FILAS
): ExitPollRowView[] {
  return [...filas]
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, max)
    .map((row) => {
      const match = matchCandidate(row, roll);
      return {
        nombre: row.nombre,
        // The JNE roll spells parties properly; the source's spelling is the fallback.
        partido: match?.partido ?? row.partido ?? null,
        porcentaje: row.porcentaje,
        slug: match?.slug ?? null,
      };
    });
}

/** Published sources only, each sorted and capped at 10. */
export function buildExitPollView(
  sources: ExitPollSource[] = EXIT_POLL_SOURCES,
  roll: CandidatoMunicipal[] = candidatosPorAmbito(AMBITO_PROVINCIAL)
): ExitPollSourceView[] {
  return sources
    .filter((s) => s.filas.length > 0)
    .map((s) => ({ ...s, filas: resolveRows(s.filas, roll) }));
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
