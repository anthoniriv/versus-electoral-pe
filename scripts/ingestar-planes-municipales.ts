/**
 * Genera el catálogo versionado de propuestas municipales desde el resumen
 * estructurado de planes de gobierno de la Plataforma Electoral del JNE.
 *
 *   npm run ingest:planes-municipales
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CANDIDATOS_MUNICIPALES } from "../src/lib/municipales";

const BASE = "https://plataformahistorico.jne.gob.pe";
const FUENTE = `${BASE}/ListaDeCandidatos/`;
const PROCESO = 126;
const CONCURRENCIA = 16;

interface ListaJne {
  idPlanGobierno: number;
  strCodExpediente: string;
}

interface DimensionJne {
  idPlanGobDimension: number;
  strPGProblema: string;
  strPGObjetivo: string;
  strPGIndicador: string | null;
  strPGMeta: string | null;
}

interface PlanJne {
  idPlanGobierno: number;
  strFechaRegistro: string | null;
  strFechaResumenGenerado: string | null;
  ListPGDSocial: DimensionJne[];
  ListPGDEconomica: DimensionJne[];
  ListPGDAmbiental: DimensionJne[];
  ListPGDInstitucional: DimensionJne[];
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

async function getJson<T>(path: string, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json() as ApiResponse<T>;
      if (!body.success) throw new Error(body.message || "Respuesta no exitosa del JNE");
      return body.data;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 500));
    }
  }
  throw lastError;
}

async function mapConcurrent<T, R>(items: T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, items.length) }, worker));
  return results;
}

function propuestasDe(plan: PlanJne) {
  const dimensiones: Array<[string, DimensionJne[]]> = [
    ["SOCIAL", plan.ListPGDSocial ?? []],
    ["ECONOMICA", plan.ListPGDEconomica ?? []],
    ["AMBIENTAL", plan.ListPGDAmbiental ?? []],
    ["INSTITUCIONAL", plan.ListPGDInstitucional ?? []],
  ];

  return dimensiones.flatMap(([dimension, items], dimensionIndex) =>
    items.map((item, index) => ({
      jneId: item.idPlanGobDimension || -(plan.idPlanGobierno * 100 + dimensionIndex * 20 + index),
      dimension,
      problema: item.strPGProblema?.trim() || "No especificado",
      objetivo: item.strPGObjetivo?.trim() || "No especificado",
      indicador: item.strPGIndicador?.trim() || null,
      meta: item.strPGMeta?.trim() || null,
      orden: index + 1,
    }))
  );
}

async function main() {
  const [provinciales, distritales] = await Promise.all([
    getJson<ListaJne[]>(`/Candidato/GetExpedientesLista/${PROCESO}-5-140100------0-`),
    getJson<ListaJne[]>(`/Candidato/GetExpedientesLista/${PROCESO}-6-1401------0-`),
  ]);
  const porExpediente = new Map([...provinciales, ...distritales].map((lista) => [lista.strCodExpediente, lista]));
  const sinLista: string[] = [];
  const sinPlan: string[] = [];
  const errores: Array<{ expediente: string; error: string }> = [];

  const objetivos = CANDIDATOS_MUNICIPALES.flatMap((candidato) => {
    const lista = porExpediente.get(candidato.expediente);
    if (!lista) {
      sinLista.push(candidato.expediente);
      return [];
    }
    if (!lista.idPlanGobierno) {
      sinPlan.push(candidato.expediente);
      return [];
    }
    return [{ candidato, planId: lista.idPlanGobierno }];
  });

  let procesados = 0;
  const descargados = await mapConcurrent(objetivos, async ({ candidato, planId }) => {
    try {
      const plan = await getJson<PlanJne>(`/Candidato/GetPlanGobiernoById/${planId}`);
      procesados++;
      if (procesados % 50 === 0 || procesados === objetivos.length) {
        console.log(`JNE: ${procesados}/${objetivos.length} planes consultados`);
      }
      return {
        slug: candidato.slug,
        plan: {
          jneId: plan.idPlanGobierno,
          expediente: candidato.expediente,
          fuenteUrl: FUENTE,
          pdfUrl: `https://declara.jne.gob.pe/ASSETS/PLANGOBIERNO/FILEPLANGOBIERNO/${plan.idPlanGobierno}.pdf`,
          fechaRegistro: plan.strFechaRegistro,
          fechaResumen: plan.strFechaResumenGenerado,
          propuestas: propuestasDe(plan),
        },
      };
    } catch (error) {
      errores.push({ expediente: candidato.expediente, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  });

  const planes = Object.fromEntries(
    descargados.filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.slug.localeCompare(b.slug, "es"))
      .map((item) => [item.slug, item.plan])
  );
  const propuestas = Object.values(planes).flatMap((plan) => plan.propuestas);
  const porDimension = propuestas.reduce<Record<string, number>>((counts, propuesta) => {
    counts[propuesta.dimension] = (counts[propuesta.dimension] ?? 0) + 1;
    return counts;
  }, {});

  const salida = {
    metadata: {
      fuente: FUENTE,
      fechaConsulta: new Date().toISOString(),
      candidatosObjetivo: CANDIDATOS_MUNICIPALES.length,
      listasJneConsultadas: provinciales.length + distritales.length,
      planesGuardados: Object.keys(planes).length,
      propuestasGuardadas: propuestas.length,
      propuestasPorDimension: porDimension,
      sinLista,
      sinPlan,
      errores,
    },
    planes,
  };

  const destino = resolve("src/lib/planes-gobierno-data.json");
  await writeFile(destino, `${JSON.stringify(salida, null, 2)}\n`, "utf8");
  console.log(`✓ ${Object.keys(planes).length} planes y ${propuestas.length} propuestas escritos en ${destino}`);
  console.log(`  Sin lista: ${sinLista.length} · sin plan: ${sinPlan.length} · errores: ${errores.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
