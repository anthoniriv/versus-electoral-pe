import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { VersusSelector } from "@/components/VersusSelector";

export const metadata: Metadata = {
  title: "Versus — Compara Candidatos",
  description:
    "Compara cara a cara a los candidatos presidenciales del Perú 2026. Descubre quién tiene más denuncias, acusaciones y sentencias.",
  alternates: {
    canonical: `${SITE_URL}/versus`,
  },
  openGraph: {
    title: `Versus de Candidatos | ${SITE_NAME}`,
    description:
      "Compara cara a cara a los candidatos presidenciales del Perú 2026.",
    url: `${SITE_URL}/versus`,
  },
};

export default function VersusPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <VersusSelector />
    </div>
  );
}
