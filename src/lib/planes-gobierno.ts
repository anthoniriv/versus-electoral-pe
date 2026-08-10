import data from "./planes-gobierno-data.json";

export const DIMENSIONES_PLAN = ["SOCIAL", "ECONOMICA", "AMBIENTAL", "INSTITUCIONAL"] as const;

export interface PropuestaView {
  jneId: number;
  dimension: string;
  problema: string;
  objetivo: string;
  indicador: string | null;
  meta: string | null;
  orden: number;
}

export interface PlanGobiernoView {
  jneId: number;
  expediente: string;
  fuenteUrl: string;
  pdfUrl: string | null;
  fechaRegistro: string | null;
  fechaResumen: string | null;
  propuestas: PropuestaView[];
}

const PLANES = data.planes as Record<string, PlanGobiernoView>;

export const METADATA_PLANES = data.metadata;

export async function obtenerPlanGobierno(slug: string): Promise<PlanGobiernoView | null> {
  return PLANES[slug] ?? null;
}
