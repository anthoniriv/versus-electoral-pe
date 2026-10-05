/**
 * Downloads ONPE's official count for Lima Metropolitana and its 42 districts
 * and writes src/lib/conteo-oficial-data.json. Commit and redeploy to publish.
 *
 *   npm run sync:onpe
 *
 * ONPE's HTML sits behind an AWS WAF challenge, but the JSON backend answers
 * browser-like requests. Run this locally: Vercel's IPs may still be challenged.
 * An ámbito is written only once it has valid votes, so the home page stays
 * in its normal mode until counting starts.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { AMBITO_PROVINCIAL, DISTRITOS_LIMA } from "../src/lib/municipales";
import { normalize } from "../src/lib/normalize";
import type { ConteoAmbitoInput } from "../src/lib/conteo-oficial";

const BASE = "https://resultadoelectoral.onpe.gob.pe/presentacion-backend";
const DEPARTAMENTO = 140000;
const PROVINCIA = 140100;
const ELECCION_PROVINCIAL = 3;
const ELECCION_DISTRITAL = 4;
const OUT = join(__dirname, "../src/lib/conteo-oficial-data.json");

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

async function onpe<T>(path: string, eleccion: number, distrito?: string): Promise<T> {
  const params = new URLSearchParams({
    idEleccion: String(eleccion),
    tipoFiltro: distrito ? "ubigeo_nivel_03" : "ubigeo_nivel_02",
    idAmbitoGeografico: "1",
    idUbigeoDepartamento: String(DEPARTAMENTO),
    idUbigeoProvincia: String(PROVINCIA),
  });
  if (distrito) params.set("idUbigeoDistrito", distrito);
  const url = `${BASE}/${path}?${params}`;
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  if (!res.ok || !text.startsWith("{")) {
    throw new Error(`ONPE ${res.status} for ${url}: ${text.slice(0, 120)}`);
  }
  return (JSON.parse(text) as { data: T }).data;
}

function key(nombre: string): string {
  return normalize(nombre).replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim().toUpperCase();
}

async function ambito(eleccion: number, distrito?: string): Promise<{ input: ConteoAmbitoInput; fecha: string } | null> {
  const [totales, participantes] = await Promise.all([
    onpe<Totales>("resumen-general/totales", eleccion, distrito),
    onpe<Participante[]>("resumen-general/participantes", eleccion, distrito),
  ]);
  if (!totales || totales.totalVotosValidos <= 0) return null;
  const filas = participantes.map((p) => {
    const reemplazo = p.nombreCandidato.trim() ? undefined : SIN_CANDIDATO[`${eleccion}:${key(p.nombreAgrupacionPolitica)}`];
    return {
      nombre: p.nombreCandidato.trim() || reemplazo?.nombre || p.nombreAgrupacionPolitica,
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

async function main() {
  const onpeDistritos = await onpe<Array<{ nombre: string; ubigeo: string }>>("ubigeos/distritos", ELECCION_PROVINCIAL);
  const ubigeoPorNombre = new Map(onpeDistritos.map((d) => [key(d.nombre), d.ubigeo]));

  const distritos = DISTRITOS_LIMA.filter((d) => !d.sinAlcaldiaPropia).map((d) => {
    const ubigeo = ubigeoPorNombre.get(key(d.nombre));
    if (!ubigeo) throw new Error(`No ONPE ubigeo for ${d.nombre} (${key(d.nombre)})`);
    return { slug: d.slug, ubigeo };
  });

  const ambitos: Record<string, ConteoAmbitoInput> = {};
  const fechas: string[] = [];
  const provincial = await ambito(ELECCION_PROVINCIAL);
  if (provincial) {
    ambitos[AMBITO_PROVINCIAL] = provincial.input;
    fechas.push(provincial.fecha);
  }
  for (let i = 0; i < distritos.length; i += 6) {
    const lote = distritos.slice(i, i + 6);
    const resultados = await Promise.all(lote.map((d) => ambito(ELECCION_DISTRITAL, d.ubigeo)));
    resultados.forEach((r, j) => {
      if (!r) return;
      ambitos[lote[j].slug] = r.input;
      fechas.push(r.fecha);
    });
  }

  const ultima = fechas.sort().at(-1);
  const actualizado = ultima
    ? new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(ultima))
    : null;

  writeFileSync(OUT, `${JSON.stringify({ actualizado, ambitos }, null, 2)}\n`);
  const lima = ambitos[AMBITO_PROVINCIAL];
  console.log(
    `ONPE ${actualizado ?? "(sin votos aún)"}: ${Object.keys(ambitos).length}/43 ámbitos con votos` +
      (lima ? ` · Lima ${lima.actasPct}% actas` : "")
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
