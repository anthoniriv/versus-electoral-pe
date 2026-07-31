import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { CandidatosList } from "@/components/CandidatosList";
import { obtenerResumenCandidatos } from "@/lib/candidatos-resumen";
import { getEleccion } from "@/lib/elecciones";
import { AMBITO_PROVINCIAL, DISTRITOS_LIMA, distritosConCandidatos } from "@/lib/municipales";
import { SinDatosEleccion } from "@/components/SinDatosEleccion";

export const revalidate = 1800;

const ELECCION = getEleccion("municipal-2026");

export const metadata: Metadata = {
  title: "Candidatos a Alcalde de Lima 2026",
  description:
    "Candidatos a la alcaldía de Lima Metropolitana y de los 43 distritos en las elecciones municipales 2026, con su registro de acusaciones, denuncias y sentencias.",
  alternates: {
    canonical: `${SITE_URL}/alcaldes`,
    languages: {
      "x-default": `${SITE_URL}/alcaldes`,
      es: `${SITE_URL}/alcaldes`,
    },
  },
  openGraph: {
    title: `Candidatos a Alcalde 2026 | ${SITE_NAME}`,
    description:
      "Candidatos a la alcaldía de Lima Metropolitana y sus distritos en las elecciones municipales 2026.",
    url: `${SITE_URL}/alcaldes`,
  },
};

export default async function AlcaldesPage() {
  let candidatos: Awaited<ReturnType<typeof obtenerResumenCandidatos>> = [];

  try {
    candidatos = await obtenerResumenCandidatos({
      eleccion: "municipal-2026",
      ambito: AMBITO_PROVINCIAL,
    });
  } catch {
    // DB not ready
  }

  const conDatos = distritosConCandidatos();

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white uppercase tracking-wider">
            Alcaldía de Lima Metropolitana 2026
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mb-6">
            Elección municipal del {ELECCION.fecha}. Selecciona un candidato para ver
            sus noticias, denuncias y sentencias.
          </p>

          {candidatos.length > 0 ? (
            <CandidatosList candidatos={candidatos} basePath="/alcaldes" />
          ) : (
            <SinDatosEleccion />
          )}

          <h2 className="mt-14 mb-3 text-lg sm:text-xl font-black text-white uppercase tracking-wider">
            Por distrito
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            43 distritos de Lima.{" "}
            {conDatos.length === 0
              ? "Aún sin candidatos cargados."
              : `${conDatos.length} con candidatos cargados.`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {DISTRITOS_LIMA.map((d) => {
              const tieneDatos = conDatos.some((x) => x.slug === d.slug);
              return (
                <Link
                  key={d.slug}
                  href={`/alcaldes/distrito/${d.slug}`}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    tieneDatos
                      ? "border-gray-700 bg-gray-900/60 text-white hover:border-red-500/70"
                      : "border-gray-800/70 bg-gray-900/30 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  {d.nombre}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
