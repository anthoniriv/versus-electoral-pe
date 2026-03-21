import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { ApoyanosContent } from "@/components/ApoyanosContent";

export const metadata: Metadata = {
  title: `Apóyanos | ${SITE_NAME}`,
  description:
    "Conoce al equipo detrás de Versus Electoral Perú, nuestra misión y cómo puedes apoyar el proyecto.",
  alternates: {
    canonical: `${SITE_URL}/apoyanos`,
    languages: {
      "x-default": `${SITE_URL}/apoyanos`,
      es: `${SITE_URL}/apoyanos`,
    },
  },
  openGraph: {
    title: `Apóyanos | ${SITE_NAME}`,
    description:
      "Conoce al equipo detrás de Versus Electoral Perú, nuestra misión y cómo puedes apoyar el proyecto.",
    url: `${SITE_URL}/apoyanos`,
  },
};

export default function ApoyanosPage() {
  return <ApoyanosContent />;
}
