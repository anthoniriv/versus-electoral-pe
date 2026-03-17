import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { CandidatosList } from "@/components/CandidatosList";
import { obtenerResumenCandidatos } from "@/lib/candidatos-resumen";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Todos los Candidatos Presidenciales 2026",
  description:
    "Lista completa de los 36 candidatos presidenciales del Perú 2026 con registro de acusaciones, denuncias y sentencias.",
  alternates: {
    canonical: `${SITE_URL}/candidato`,
    languages: {
      "x-default": `${SITE_URL}/candidato`,
      es: `${SITE_URL}/candidato`,
    },
  },
  openGraph: {
    title: `Candidatos Presidenciales 2026 | ${SITE_NAME}`,
    description:
      "Lista completa de los 36 candidatos presidenciales del Perú 2026 con registro de acusaciones, denuncias y sentencias.",
    url: `${SITE_URL}/candidato`,
  },
};

export default async function CandidatosPage() {
  let candidatos: Awaited<ReturnType<typeof obtenerResumenCandidatos>> = [];

  try {
    candidatos = await obtenerResumenCandidatos();
  } catch {
    // DB not ready
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white uppercase tracking-wider">
            Candidatos Presidenciales 2026
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mb-6">
            Selecciona un candidato para ver sus noticias, denuncias y sentencias.
          </p>
          <CandidatosList candidatos={candidatos} />
        </div>
      </section>
    </div>
  );
}
