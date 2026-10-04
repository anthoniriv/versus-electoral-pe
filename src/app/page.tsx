import Link from "next/link";
import { ExitPollResults } from "@/components/ExitPollResults";
import { FaqAccordion } from "@/components/FaqAccordion";
import { FlashCountdown } from "@/components/FlashCountdown";
import { HomeSearch } from "@/components/HomeSearch";
import { OfficialCount } from "@/components/OfficialCount";
import { SupportCard } from "@/components/SupportCard";
import { buildConteoOficialView } from "@/lib/conteo-oficial";
import { buildExitPollView, EXIT_POLL_AMBITO, EXIT_POLL_DEFAULT } from "@/lib/exit-poll";
import { buildHomeSearchIndex } from "@/lib/home-search";
import { distritosConCandidatos } from "@/lib/municipales";

// El cron invalida estas rutas con revalidatePath cuando el scraping trae algo
// nuevo. Este TTL es solo la red de seguridad por si esa invalidación no corre.
export const revalidate = 86400;

export default function Home() {
  const searchIndex = buildHomeSearchIndex();
  // Election night: once exit poll or official numbers are loaded the hero swaps
  // its CTAs, countdown and support card for the results.
  const exitPoll = buildExitPollView();
  const conteo = buildConteoOficialView();
  const resultsMode = exitPoll.length > 0 || conteo !== null;

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
          <p className="mb-2 hidden animate-fade-in text-[11px] font-bold uppercase tracking-[0.35em] text-red-500 sm:block">
            Elecciones Municipales · Lima 2026
          </p>
          {resultsMode ? (
            <>
              <h1 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-white">Resultados</span>{" "}
                <span className="text-red-500">{conteo ? "oficiales ONPE" : "boca de urna"}</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-snug text-gray-400 sm:text-base">
                {conteo
                  ? "Conteo de actas de Lima Metropolitana y sus distritos. Elige tu distrito para ver su alcaldía."
                  : "Estimaciones de las encuestadoras al cierre de la votación. No son resultados oficiales."}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-white">Versus</span>{" "}
                <span className="text-red-500">Electoral Perú</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-snug text-gray-400 sm:text-base">
                Compara candidatos municipales, sus propuestas oficiales y noticias verificadas.
              </p>
            </>
          )}

          <div className="mt-6 sm:mt-8">
            <HomeSearch index={searchIndex} />
            {/* The one entry point to Versus from the home page, kept next to search so it is reachable without scrolling */}
            {resultsMode ? null : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
              <Link
                prefetch={false}
                href="/alcaldes/versus"
                data-analytics-cta="compare_candidates"
                data-analytics-location="home_hero"
                className="group inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs font-bold uppercase tracking-wide sm:gap-2 sm:px-6 sm:py-3 sm:text-sm sm:tracking-wider text-red-400 transition-[color,background-color,border-color,transform] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:border-red-500/60 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-red-950/30 active:scale-[0.97]"
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
              </Link>
              {/* Official ONPE lookup; we only link to it and never ask for the voter's DNI ourselves */}
              <a
                href="https://consultaelectoral.onpe.gob.pe/inicio"
                data-analytics-cta="voting_place"
                data-analytics-location="home_hero"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-gray-600 bg-gray-900/60 px-3 py-2 text-xs font-bold uppercase tracking-wide sm:gap-2 sm:px-6 sm:py-3 sm:text-sm sm:tracking-wider text-gray-200 transition-[color,background-color,border-color,transform] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:border-gray-400 [@media(hover:hover)_and_(pointer:fine)]:hover:text-white active:scale-[0.97]"
              >
                Conoce tu local de votación
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5h5v5M19 5l-8 8M10 7H6a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4" />
                </svg>
                <span className="sr-only">(sitio oficial de la ONPE, se abre en otra pestaña)</span>
              </a>
            </div>
            )}
          </div>

          {resultsMode ? (
            <>
              {/* Above the exit poll: with 10 rows anything below would fall far below the fold */}
              {conteo ? (
                <OfficialCount conteo={conteo} />
              ) : (
                <OfficialCountNotice distritos={distritosConCandidatos().length} />
              )}
              {exitPoll.length > 0 && (
                <ExitPollResults sources={exitPoll} defaultSource={EXIT_POLL_DEFAULT} ambito={EXIT_POLL_AMBITO} />
              )}
            </>
          ) : (
            <FlashCountdown />
          )}
        </div>
      </section>

      {/* Support ask placed right after the countdown so it is visible without scrolling */}
      {resultsMode ? null : (
        <div className="mx-auto w-full max-w-[50rem] px-4">
          <SupportCard />
        </div>
      )}

      {/* FAQ */}
      <section id="faq" className="mt-10 border-t border-gray-800/40 px-4 py-12 sm:mt-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-lg font-black sm:mb-10 sm:text-xl uppercase tracking-[0.2em] text-white">
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

function OfficialCountNotice({ distritos }: { distritos: number }) {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-dashed border-gray-700 bg-gray-900/20 px-4 py-3 text-left sm:mt-8 sm:px-6">
      <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <div>
        <p className="text-sm font-bold text-white">Conteo oficial de la ONPE: en preparación</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          Estamos trabajando para traer aquí el conteo oficial de Lima Metropolitana y de los {distritos} distritos
          apenas la ONPE publique sus actas procesadas.
        </p>
      </div>
    </div>
  );
}
