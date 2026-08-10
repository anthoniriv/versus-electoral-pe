import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { VersusMunicipal } from "@/components/VersusMunicipal";
import { SinDatosEleccion } from "@/components/SinDatosEleccion";
import { CANDIDATOS_MUNICIPALES } from "@/lib/municipales";

export const metadata: Metadata = {
  title: "Versus — Compara Candidatos a Alcalde",
  description:
    "Compara cara a cara a los candidatos a la alcaldía de Lima y sus distritos en las municipales 2026. Descubre quién tiene más denuncias, acusaciones y sentencias.",
  alternates: {
    canonical: `${SITE_URL}/alcaldes/versus`,
    languages: {
      "x-default": `${SITE_URL}/alcaldes/versus`,
      es: `${SITE_URL}/alcaldes/versus`,
    },
  },
  openGraph: {
    title: `Versus de Candidatos a Alcalde | ${SITE_NAME}`,
    description:
      "Compara cara a cara a los candidatos a alcalde en las elecciones municipales 2026.",
    url: `${SITE_URL}/alcaldes/versus`,
  },
};

export default function AlcaldesVersusPage() {
  if (CANDIDATOS_MUNICIPALES.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-center text-2xl font-black uppercase tracking-wider text-white">
            Versus municipal 2026
          </h1>
          <SinDatosEleccion detalle="El versus de alcaldes se activa apenas carguemos las listas inscritas del JNE para las municipales 2026." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <VersusMunicipal />
    </div>
  );
}
