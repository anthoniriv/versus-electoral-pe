import { prisma } from "./db";
import { ELECCION_DEFAULT, type EleccionId } from "./elecciones";
import { candidatosPorAmbito } from "./municipales";

export interface CandidatoResumen {
  id: number;
  nombre: string;
  partido: string;
  slug: string;
  totalNoticias: number;
  peorGravedad: string;
  gravedadCounts: Record<string, number>;
}

export interface FiltroCandidatos {
  eleccion?: EleccionId;
  /** Solo municipales: lima-metropolitana o slug de distrito */
  ambito?: string;
}

const ORDEN_GRAVEDAD = ["MUY_PELIGROSO", "PELIGROSO", "MODERADO", "LEVE", "LIMPIO"];

/**
 * Resumen municipal por ámbito. El padrón del JNE manda sobre quién postula: la
 * BD solo aporta el conteo de noticias, así que la lista está completa desde el
 * primer deploy, aunque el scraping de ese ámbito todavía no haya corrido.
 */
export async function obtenerResumenMunicipal(ambito: string): Promise<CandidatoResumen[]> {
  let deDb: CandidatoResumen[] = [];
  try {
    deDb = await obtenerResumenCandidatos({ eleccion: "municipal-2026", ambito });
  } catch {
    // DB not ready
  }

  const porSlug = new Map(deDb.map((c) => [c.slug, c]));

  return candidatosPorAmbito(ambito)
    .map((c, i) => {
      const existente = porSlug.get(c.slug);
      if (existente) return existente;
      return {
        id: -(i + 1), // sin fila en BD todavía; el link va por slug
        nombre: c.nombre,
        partido: c.partido,
        slug: c.slug,
        totalNoticias: 0,
        peorGravedad: "LIMPIO",
        gravedadCounts: {},
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-PE"));
}

export async function obtenerResumenCandidatos(
  filtro: FiltroCandidatos = {}
): Promise<CandidatoResumen[]> {
  const { eleccion = ELECCION_DEFAULT, ambito } = filtro;

  const [candidatos, grouped] = await Promise.all([
    prisma.candidato.findMany({
      where: { eleccion, ...(ambito ? { ambito } : {}) },
      select: { id: true, nombre: true, partido: true, slug: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.noticia.groupBy({
      by: ["candidatoId", "gravedad"],
      _count: { _all: true },
    }),
  ]);

  const countsByCandidato = new Map<number, Record<string, number>>();

  for (const row of grouped) {
    const prev = countsByCandidato.get(row.candidatoId) || {};
    prev[row.gravedad] = row._count._all;
    countsByCandidato.set(row.candidatoId, prev);
  }

  return candidatos.map((c) => {
    const gravedadCounts = countsByCandidato.get(c.id) || {};
    const totalNoticias = Object.values(gravedadCounts).reduce((acc, n) => acc + n, 0);

    let peorGravedad = "LIMPIO";
    for (const g of ORDEN_GRAVEDAD) {
      if (gravedadCounts[g]) {
        peorGravedad = g;
        break;
      }
    }

    return {
      id: c.id,
      nombre: c.nombre,
      partido: c.partido,
      slug: c.slug,
      totalNoticias,
      peorGravedad,
      gravedadCounts,
    };
  });
}
