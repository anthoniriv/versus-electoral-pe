import { prisma } from "./db";

export interface CandidatoResumen {
  id: number;
  nombre: string;
  partido: string;
  slug: string;
  totalNoticias: number;
  peorGravedad: string;
  gravedadCounts: Record<string, number>;
}

const ORDEN_GRAVEDAD = ["MUY_PELIGROSO", "PELIGROSO", "MODERADO", "LEVE", "LIMPIO"];

export async function obtenerResumenCandidatos(): Promise<CandidatoResumen[]> {
  const [candidatos, grouped] = await Promise.all([
    prisma.candidato.findMany({
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
