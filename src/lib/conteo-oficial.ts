import { resolveRows, type ExitPollRow, type ExitPollRowView } from "./exit-poll";
import { AMBITO_PROVINCIAL, candidatosPorAmbito, DISTRITOS_LIMA } from "./municipales";
import conteoData from "./conteo-oficial-data.json";

/**
 * Official ONPE count, published with a redeploy.
 *
 * `npm run sync:onpe` downloads Lima Metropolitana and its 42 districts from
 * ONPE's JSON backend into conteo-oficial-data.json. Percentages are of valid
 * votes, as ONPE shows them. Every ámbito is optional; the home page lists the
 * ones still pending.
 *
 * A redeploy rebuilds the home page once, so frequent updates cost no ISR writes.
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
  ].map(({ slug, nombre }) => {
    const input = data[slug];
    return {
      slug,
      nombre,
      actasPct: input && input.filas.length > 0 ? input.actasPct : null,
      actas: input?.actas ?? null,
      votosValidos: input?.votosValidos ?? null,
      filas: input ? resolveRows(input.filas, candidatosPorAmbito(slug), CONTEO_MAX_FILAS) : [],
    };
  });
  return { actualizado, ambitos };
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
