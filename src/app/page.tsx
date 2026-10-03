import { prisma } from "@/lib/db";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HomeSearch } from "@/components/HomeSearch";
import { SmartlinkLink } from "@/components/SmartlinkLink";
import { SupportCard } from "@/components/SupportCard";
import { buildHomeSearchIndex } from "@/lib/home-search";
import { CANDIDATOS_MUNICIPALES, distritosConCandidatos } from "@/lib/municipales";
import { METADATA_PLANES } from "@/lib/planes-gobierno";

// El cron invalida estas rutas con revalidatePath cuando el scraping trae algo
// nuevo. Este TTL es solo la red de seguridad por si esa invalidación no corre.
export const revalidate = 86400;

const HOME_STATS_BASE = {
  candidatos: CANDIDATOS_MUNICIPALES.length,
  alcaldias: distritosConCandidatos().length + 1,
  propuestas: METADATA_PLANES.propuestasGuardadas,
  fuentes: 20,
};

async function obtenerConteoNoticiasHome(): Promise<number> {
  try {
    return await prisma.noticia.count({
      where: { candidato: { eleccion: "municipal-2026" } },
    });
  } catch (error) {
    console.error("[HOME] Error contando noticias en DB, usando fallback estático:", error);
    return Number(process.env.NEXT_PUBLIC_HOME_MUNICIPAL_NEWS_COUNT || "0");
  }
}

export default async function Home() {
  const stats = { ...HOME_STATS_BASE, noticias: await obtenerConteoNoticiasHome() };
  const searchIndex = buildHomeSearchIndex();

  const faqData = [
    {
      question: "¿De dónde se obtiene la información de los candidatos?",
      answer:
        "Las candidaturas y planes de gobierno proceden de la Plataforma Electoral del JNE. Las noticias se recopilan de más de 20 medios periodísticos peruanos y cada registro conserva el enlace a su fuente original.",
    },
    {
      question: "¿Cómo se clasifica la gravedad de las noticias?",
      answer:
        "Se usa un sistema de clasificación contextual que analiza la dirección de la acción: si el candidato fue sentenciado, acusado o investigado (se clasifica por gravedad) o si el candidato propone, opina o critica (se descarta). Esto evita falsos positivos como clasificar una propuesta de ley como una sentencia.",
    },
    {
      question: "¿Con qué frecuencia se actualiza la información?",
      answer:
        "El monitoreo se ejecuta dos veces al día y rota por las alcaldías de Lima para mantener cubiertos los 485 candidatos sin saturar las fuentes.",
    },
    {
      question: "¿Esta clasificación tiene valor legal?",
      answer:
        "No. Las clasificaciones son automáticas y orientativas. No constituyen juicio legal ni reemplazan la presunción de inocencia. Consulte las fuentes originales para información completa.",
    },
  ];

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      {/* Hero: compact so the search box clears the fold at 390x844 */}
      {/* No overflow-hidden on the section: it would clip the search results popover. */}
      <section className="relative px-4 pt-8 pb-6 text-center sm:pt-12 sm:pb-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-gray-950/50 to-gray-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <p className="mb-2 animate-fade-in text-[11px] font-bold uppercase tracking-[0.35em] text-red-500">
            Elecciones Municipales · Lima 2026
          </p>
          <h1 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-white">Versus</span>{" "}
            <span className="text-red-500">Electoral Perú</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-snug text-gray-400 sm:text-base">
            Compara candidatos municipales, sus propuestas oficiales y noticias verificadas.
          </p>

          <div className="mt-6 sm:mt-8">
            <HomeSearch index={searchIndex} />
            {/* The one entry point to Versus from the home page, kept next to search so it is reachable without scrolling */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <SmartlinkLink
                prefetch={false}
                href="/alcaldes/versus"
                className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-6 py-3 text-sm font-bold uppercase tracking-wider text-red-400 transition-[color,background-color,border-color,transform] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:border-red-500/60 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-red-950/30 active:scale-[0.97]"
              >
                Comparar candidatos
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-150 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </SmartlinkLink>
              {/* Official ONPE lookup; we only link to it and never ask for the voter's DNI ourselves */}
              <a
                href="https://consultaelectoral.onpe.gob.pe/inicio"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-600 bg-gray-900/60 px-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-200 transition-[color,background-color,border-color,transform] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:border-gray-400 [@media(hover:hover)_and_(pointer:fine)]:hover:text-white active:scale-[0.97]"
              >
                Conoce tu local de votación
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5h5v5M19 5l-8 8M10 7H6a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4" />
                </svg>
                <span className="sr-only">(sitio oficial de la ONPE, se abre en otra pestaña)</span>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-gray-800/60 bg-gray-900/40 px-6 py-4 backdrop-blur-sm sm:mt-8 sm:grid-cols-4 sm:gap-8 sm:px-8">
            <div>
              <p className="text-2xl font-black text-white sm:text-3xl">{stats.candidatos}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">Candidatos</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white sm:text-3xl">{stats.alcaldias}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">Alcaldías</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white sm:text-3xl">{stats.propuestas.toLocaleString()}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">Propuestas</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white sm:text-3xl">{stats.noticias.toLocaleString()}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">Noticias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Support ask placed right after the stats so it is visible without scrolling */}
      <div className="mx-auto w-full max-w-[50rem] px-4">
        <SupportCard />
      </div>

      {/* FAQ */}
      <section id="faq" className="mt-14 border-t border-gray-800/40 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-xl font-black uppercase tracking-[0.2em] text-white">
            Preguntas Frecuentes
          </h2>
          <div className="mx-auto max-w-3xl">
            <FaqAccordion items={faqData} />
          </div>
        </div>
      </section>
    </div>
  );
}
