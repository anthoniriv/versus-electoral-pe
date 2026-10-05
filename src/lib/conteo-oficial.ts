import { resolveRows, type ExitPollRow, type ExitPollRowView } from "./exit-poll";
import { AMBITO_PROVINCIAL, candidatosPorAmbito, DISTRITOS_LIMA } from "./municipales";
import conteoData from "./conteo-oficial-data.json";

/**
 * Official ONPE count.
 *
 * The home page renders the snapshot committed in conteo-oficial-data.json and
 * then polls /api/onpe/conteo, which serves the copy `npm run sync:onpe` keeps in
 * the database, so the count updates every minute without redeploys. The
 * committed snapshot is the fallback. Percentages are of valid votes, as ONPE
 * shows them.
 */

export interface ConteoAmbitoInput {
  /** Actas contabilizadas, 0-100, as ONPE shows it. */
  actasPct: number;
  /** Actas counted and expected; absent in data synced before ONPE exposed them. */
  actas?: ConteoActas;
  votosValidos?: number;
  filas: ExitPollRow[];
}

export interface ConteoActas {
  contabilizadas: number;
  total: number;
}

/** Shape of conteo-oficial-data.json and of the ConteoOnpe row's `data`. */
export interface ConteoSnapshot {
  actualizado: string | null;
  ambitos: Record<string, ConteoAmbitoInput>;
}

/** ConteoOnpe row holding the ERM 2026 Lima count. */
export const CONTEO_ID = "erm-2026-lima";

/** Free-text time of ONPE's last update, e.g. "10:45 p. m.". */
export const CONTEO_ACTUALIZADO: string | null = conteoData.actualizado;

export const CONTEO_OFICIAL: Record<string, ConteoAmbitoInput> = conteoData.ambitos;

export const CONTEO_MAX_FILAS = 10;

export interface ConteoAmbitoView {
  slug: string;
  nombre: string;
  actasPct: number | null;
  actas: ConteoActas | null;
  votosValidos: number | null;
  filas: ExitPollRowView[];
}

export interface ConteoOficialView {
  actualizado: string | null;
  ambitos: ConteoAmbitoView[];
}

/** Lima Metropolitana first, then the 42 districts that elect a mayor, in roll order. */
export function buildConteoOficialView(
  data: Record<string, ConteoAmbitoInput> = CONTEO_OFICIAL,
  actualizado: string | null = CONTEO_ACTUALIZADO
): ConteoOficialView | null {
  if (!Object.values(data).some((a) => a.filas.length > 0)) return null;
  const ambitos = [
    { slug: AMBITO_PROVINCIAL, nombre: "Lima Metropolitana" },
    ...DISTRITOS_LIMA.filter((d) => !d.sinAlcaldiaPropia),
  ].map(({ slug, nombre }) => buildConteoAmbitoView(slug, nombre, data[slug]));
  return { actualizado, ambitos };
}

/** One ámbito's rows, sorted, capped and matched against that ámbito's JNE roll. */
export function buildConteoAmbitoView(
  slug: string,
  nombre: string,
  input: ConteoAmbitoInput | undefined
): ConteoAmbitoView {
  return {
    slug,
    nombre,
    actasPct: input && input.filas.length > 0 ? input.actasPct : null,
    actas: input?.actas ?? null,
    votosValidos: input?.votosValidos ?? null,
    filas: input ? resolveRows(input.filas, candidatosPorAmbito(slug), CONTEO_MAX_FILAS) : [],
  };
}

export interface ConteoStanding {
  puesto: number;
  porcentaje: number;
  actasPct: number;
}

/** A candidate's position in the official count of their own ámbito; null when not listed. */
export function conteoStandingFor(
  slug: string,
  view: ConteoOficialView | null = buildConteoOficialView()
): ConteoStanding | null {
  for (const ambito of view?.ambitos ?? []) {
    const i = ambito.filas.findIndex((f) => f.slug === slug);
    if (i !== -1 && ambito.actasPct !== null) {
      return { puesto: i + 1, porcentaje: ambito.filas[i].porcentaje, actasPct: ambito.actasPct };
    }
  }
  return null;
}
