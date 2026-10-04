import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { type GravedadKey } from "@/lib/candidatos";
import { exitPollStandingFor } from "@/lib/exit-poll";
import { CandidatoDetalleClient } from "@/components/CandidatoDetalleClient";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { obtenerPlanGobierno } from "@/lib/planes-gobierno";
import {
  CANDIDATOS_MUNICIPALES,
  CANDIDATO_MUNICIPAL_BY_SLUG,
  DISTRITO_BY_SLUG,
  AMBITO_PROVINCIAL,
  obtenerOpcionesMunicipales,
} from "@/lib/municipales";
import { buildMunicipalComparisonUrl } from "@/lib/municipal-entry";

// El cron invalida estas rutas con revalidatePath cuando el scraping trae algo
// nuevo. Este TTL es solo la red de seguridad por si esa invalidación no corre.
export const revalidate = 86400;

export function generateStaticParams() {
  return CANDIDATOS_MUNICIPALES.map((c) => ({ slug: c.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function ambitoLabel(ambito: string | null): string {
  if (!ambito || ambito === AMBITO_PROVINCIAL) return "Lima Metropolitana";
  return DISTRITO_BY_SLUG.get(ambito)?.nombre ?? ambito;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  let candidato: { nombre: string; partido: string; ambito: string | null } | null = null;
  try {
    candidato = await prisma.candidato.findUnique({
      where: { slug },
      select: { nombre: true, partido: true, ambito: true },
    });
  } catch { /* DB not ready */ }

  if (!candidato) {
    const delPadron = CANDIDATO_MUNICIPAL_BY_SLUG.get(slug);
    if (!delPadron) return { title: "Candidato no encontrado" };
    candidato = { nombre: delPadron.nombre, partido: delPadron.partido, ambito: delPadron.ambito };
  }

  const zona = ambitoLabel(candidato.ambito);
  const title = `${candidato.nombre} — Denuncias y Acusaciones`;
  const description = `Registro de acusaciones, denuncias y sentencias de ${candidato.nombre} (${candidato.partido}), candidato a la alcaldía de ${zona} en 2026.`;
  const url = `${SITE_URL}/alcaldes/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url, languages: { "x-default": url, es: url } },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url },
  };
}

const ORDEN_GRAVEDAD: GravedadKey[] = ["MUY_PELIGROSO", "PELIGROSO", "MODERADO", "LEVE", "LIMPIO"];

export default async function AlcaldeCandidatoPage({ params }: PageProps) {
  const { slug } = await params;

  let candidato: {
    id: number; nombre: string; partido: string; slug: string;
    eleccion: string; ambito: string | null;
    noticias: Array<{
      id: number; titulo: string; descripcion: string;
      url: string; fuente: string; gravedad: string; tipo: string;
      fechaNoticia: Date | null;
    }>;
  } | null = null;

  try {
    candidato = await prisma.candidato.findUnique({
      where: { slug },
      include: { noticias: { orderBy: { fechaNoticia: { sort: "desc", nulls: "last" } }, take: 200 } },
    });
  } catch { /* DB not ready */ }

  // Un candidato presidencial no se sirve bajo /alcaldes: cada elección tiene su árbol.
  if (candidato && candidato.eleccion !== "municipal-2026") notFound();

  // Aún sin fila en BD (padrón recién cargado, scraping pendiente): mostramos la
  // ficha con los datos del JNE y sin noticias, en vez de un 404.
  if (!candidato) {
    const delPadron = CANDIDATO_MUNICIPAL_BY_SLUG.get(slug);
    if (!delPadron) notFound();
    candidato = {
      id: -1,
      nombre: delPadron.nombre,
      partido: delPadron.partido,
      slug: delPadron.slug,
      eleccion: "municipal-2026",
      ambito: delPadron.ambito,
      noticias: [],
    };
  }

  const gravedadCounts: Record<string, number> = {};
  for (const n of candidato.noticias) {
    gravedadCounts[n.gravedad] = (gravedadCounts[n.gravedad] || 0) + 1;
  }

  let peorGravedad: GravedadKey = "LIMPIO";
  for (const g of ORDEN_GRAVEDAD) {
    if (gravedadCounts[g]) {
      peorGravedad = g;
      break;
    }
  }

  const zona = ambitoLabel(candidato.ambito);
  const planGobierno = await obtenerPlanGobierno(slug);

  // Preselects the versus flow's ámbito; it only accepts ambito/prioridad, so
  // the candidate itself can't be preselected (the user still picks both
  // sides from that district's roster).
  const validAmbitos = new Set(obtenerOpcionesMunicipales().map((option) => option.slug));
  let compareHref: string | undefined;
  if (candidato.ambito && validAmbitos.has(candidato.ambito)) {
    try {
      compareHref = buildMunicipalComparisonUrl({ ambito: candidato.ambito, candidato: candidato.slug }, validAmbitos);
    } catch {
      compareHref = undefined;
    }
  }

  const personStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: candidato.nombre,
    description: `Candidato a la alcaldía de ${zona} en las elecciones municipales 2026 por ${candidato.partido}`,
    affiliation: { "@type": "Organization", name: candidato.partido },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personStructuredData) }}
      />
      <CandidatoDetalleClient
        slug={slug}
        nombre={candidato.nombre}
        partido={candidato.partido}
        peorGravedad={peorGravedad}
        gravedadCounts={gravedadCounts}
        planGobierno={planGobierno}
        basePath="/alcaldes"
        compareHref={compareHref}
        compareZonaLabel={zona}
        exitPoll={exitPollStandingFor(slug)}
        noticias={candidato.noticias.map((n) => ({
          id: n.id,
          titulo: n.titulo,
          descripcion: n.descripcion,
          url: n.url,
          fuente: n.fuente,
          gravedad: n.gravedad,
          tipo: n.tipo,
          fechaNoticia: n.fechaNoticia?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
