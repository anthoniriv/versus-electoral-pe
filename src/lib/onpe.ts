import { AMBITO_PROVINCIAL } from "./municipales";
import { normalize } from "./normalize";
import type { ConteoAmbitoInput } from "./conteo-oficial";

/**
 * Client for ONPE's results backend (resultadoelectoral.onpe.gob.pe), shared by
 * `npm run sync:onpe` and the live /api/onpe/conteo route.
 *
 * ONPE's HTML sits behind an AWS WAF challenge, but the JSON backend answers
 * requests that look like the results site's own XHRs, hence the browser headers.
 */

const BASE = "https://resultadoelectoral.onpe.gob.pe/presentacion-backend";
const DEPARTAMENTO = "140000";
const PROVINCIA = "140100";
const ELECCION_PROVINCIAL = 3;
const ELECCION_DISTRITAL = 4;

/** ONPE district ubigeos (ONPE's own codes, not INEI's) for the 42 districts that elect a mayor. */
export const ONPE_UBIGEO: Record<string, string> = {
  "ancon": "140102",
  "ate": "140103",
  "barranco": "140125",
  "brena": "140104",
  "carabayllo": "140105",
  "chaclacayo": "140107",
  "chorrillos": "140108",
  "cieneguilla": "140139",
  "comas": "140106",
  "el-agustino": "140135",
  "independencia": "140134",
  "jesus-maria": "140133",
  "la-molina": "140110",
  "la-victoria": "140109",
  "lince": "140111",
  "los-olivos": "140142",
  "lurigancho-chosica": "140112",
  "lurin": "140113",
  "magdalena-del-mar": "140114",
  "miraflores": "140115",
  "pachacamac": "140116",
  "pucusana": "140118",
  "pueblo-libre": "140117",
  "puente-piedra": "140119",
  "punta-hermosa": "140120",
  "punta-negra": "140121",
  "rimac": "140122",
  "san-bartolo": "140123",
  "san-borja": "140140",
  "san-isidro": "140124",
  "san-juan-de-lurigancho": "140137",
  "san-juan-de-miraflores": "140136",
  "san-luis": "140138",
  "san-martin-de-porres": "140126",
  "san-miguel": "140127",
  "santa-anita": "140143",
  "santa-maria-del-mar": "140128",
  "santa-rosa": "140129",
  "santiago-de-surco": "140130",
  "surquillo": "140131",
  "villa-el-salvador": "140141",
  "villa-maria-del-triunfo": "140132",
};

/** Every ámbito the count covers: Lima Metropolitana plus the 42 districts. */
export const ONPE_AMBITOS = [AMBITO_PROVINCIAL, ...Object.keys(ONPE_UBIGEO)];

// Rubio Idrogo resigned on 2026-08-04; ONPE leaves the name blank and López Aliaga
// (first councilor on the list) heads the ticket.
const SIN_CANDIDATO: Record<string, { nombre: string; foto?: string }> = {
  [`${ELECCION_PROVINCIAL}:RENOVACION POPULAR PERU`]: { nombre: "Rafael López Aliaga", foto: "rafael-lopez-aliaga" },
};

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  "Accept-Language": "es-PE,es;q=0.9",
  Referer: "https://resultadoelectoral.onpe.gob.pe/main/resumen",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
};

interface Participante {
  nombreAgrupacionPolitica: string;
  nombreCandidato: string;
  totalVotosValidos: number;
  porcentajeVotosValidos: number;
}

interface Totales {
  actasContabilizadas: number;
  contabilizadas: number;
  totalActas: number;
  totalVotosValidos: number;
  fechaActualizacion: string;
}

export interface OnpeAmbito {
  input: ConteoAmbitoInput;
  /** ISO timestamp of ONPE's last update for this ámbito. */
  fecha: string;
}

async function onpe<T>(path: string, eleccion: number, distrito?: string): Promise<T> {
  const params = new URLSearchParams({
    idEleccion: String(eleccion),
    tipoFiltro: distrito ? "ubigeo_nivel_03" : "ubigeo_nivel_02",
    idAmbitoGeografico: "1",
    idUbigeoDepartamento: DEPARTAMENTO,
    idUbigeoProvincia: PROVINCIA,
  });
  if (distrito) params.set("idUbigeoDistrito", distrito);
  const url = `${BASE}/${path}?${params}`;
  const res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  if (!res.ok || !text.startsWith("{")) {
    throw new Error(`ONPE ${res.status} for ${path}: ${text.slice(0, 80)}`);
  }
  return (JSON.parse(text) as { data: T }).data;
}

function key(nombre: string): string {
  return normalize(nombre).replace(/\s+/g, " ").trim().toUpperCase();
}

/** Fetches one ámbito's count; null until it has valid votes. Throws when ONPE is unreachable. */
export async function fetchOnpeAmbito(slug: string): Promise<OnpeAmbito | null> {
  const provincial = slug === AMBITO_PROVINCIAL;
  const eleccion = provincial ? ELECCION_PROVINCIAL : ELECCION_DISTRITAL;
  const distrito = provincial ? undefined : ONPE_UBIGEO[slug];
  if (!provincial && !distrito) throw new Error(`Unknown ámbito ${slug}`);

  const [totales, participantes] = await Promise.all([
    onpe<Totales>("resumen-general/totales", eleccion, distrito),
    onpe<Participante[]>("resumen-general/participantes", eleccion, distrito),
  ]);
  if (!totales || totales.totalVotosValidos <= 0) return null;

  const filas = participantes.map((p) => {
    const nombre = p.nombreCandidato.trim();
    const reemplazo = nombre ? undefined : SIN_CANDIDATO[`${eleccion}:${key(p.nombreAgrupacionPolitica)}`];
    return {
      nombre: nombre || reemplazo?.nombre || p.nombreAgrupacionPolitica,
      ...(reemplazo?.foto ? { foto: reemplazo.foto } : {}),
      partido: p.nombreAgrupacionPolitica,
      porcentaje: p.porcentajeVotosValidos,
      votos: p.totalVotosValidos,
    };
  });
  return {
    input: {
      actasPct: totales.actasContabilizadas,
      actas: { contabilizadas: totales.contabilizadas, total: totales.totalActas },
      votosValidos: totales.totalVotosValidos,
      filas,
    },
    fecha: totales.fechaActualizacion,
  };
}

/** "7:46 p. m." in Lima time, as the home page shows ONPE's update time. */
export function horaLima(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}
