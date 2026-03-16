import { SITE_URL, SITE_NAME } from "@/lib/site";
import Link from "next/link";
import { CANDIDATOS } from "@/lib/candidatos";
import { prisma } from "@/lib/db";

export const revalidate = 1800;

const HOME_STATS_BASE = {
  candidatos: CANDIDATOS.length,
  fuentes: 20,
};

async function obtenerConteoNoticiasHome(): Promise<number> {
  try {
    return await prisma.noticia.count();
  } catch (error) {
    console.error("[HOME] Error contando noticias en DB, usando fallback estático:", error);
    return Number(process.env.NEXT_PUBLIC_HOME_NEWS_COUNT || "1756");
  }
}

export default async function Home() {
  const stats = {
    ...HOME_STATS_BASE,
    noticias: await obtenerConteoNoticiasHome(),
  };

  const faqData = [
    {
      question: "¿De dónde se obtiene la información de los candidatos?",
      answer:
        "La información se recopila automáticamente de más de 20 medios periodísticos peruanos como RPP, El Comercio, La República, Gestión, Perú 21, IDL-Reporteros, Ojo Público, Convoca y otros. Cada noticia incluye el enlace a la fuente original.",
    },
    {
      question: "¿Cómo se clasifica la gravedad de las noticias?",
      answer:
        "Se usa un sistema de clasificación contextual que analiza la dirección de la acción: si el candidato fue sentenciado, acusado o investigado (se clasifica por gravedad) o si el candidato propone, opina o critica (se descarta). Esto evita falsos positivos como clasificar una propuesta de ley como una sentencia.",
    },
    {
      question: "¿Con qué frecuencia se actualiza la información?",
      answer:
        "El sistema se ejecuta automáticamente cada 12 horas (00:00 y 12:00, hora de Perú) para capturar noticias nuevas de todas las fuentes monitoreadas.",
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

      {/* Breaking news banner */}
      <div className="bg-red-600/90 overflow-hidden border-b border-red-500/30">
        <div className="flex items-center h-9">
          <span className="bg-white text-red-600 px-3 py-1 text-[11px] font-black uppercase shrink-0 tracking-wider">
            En vivo
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1 hidden sm:block">
            <p className="animate-marquee inline-block text-[11px] font-semibold text-white/95 pl-4 tracking-wide">
              VERSUS ELECTORAL PERÚ 2026 — Monitoreo automático de {stats.candidatos} candidatos presidenciales — {stats.noticias} noticias analizadas de {stats.fuentes} fuentes periodísticas — Actualización automática cada 12 horas (00:00 y 12:00 hrs)
            </p>
          </div>
          <div className="sm:hidden flex-1 overflow-hidden">
            <p className="text-[11px] font-semibold text-white/95 px-3 truncate">
              {stats.candidatos} candidatos • {stats.noticias.toLocaleString()} noticias • actualización cada 12h
            </p>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-12 sm:py-16 lg:py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-gray-950/50 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] mb-3 animate-fade-in">
            Elecciones Presidenciales Peru 2026
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            <span className="text-white">Versus</span>
            <br />
            <span className="text-red-500">Electoral Perú</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Monitoreo automático de <strong className="text-white">{stats.candidatos} candidatos</strong> presidenciales.
            Acusaciones, denuncias y sentencias con fuentes verificadas de {stats.fuentes} medios.
          </p>

          {/* Stats */}
          <div className="mt-6 sm:mt-8 inline-flex items-center gap-5 sm:gap-8 rounded-2xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm px-6 sm:px-8 py-4">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.candidatos}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mt-0.5">Candidatos</p>
            </div>
            <div className="h-8 w-px bg-gray-700/60" />
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.noticias.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mt-0.5">Noticias</p>
            </div>
            <div className="h-8 w-px bg-gray-700/60" />
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.fuentes}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mt-0.5">Fuentes</p>
            </div>
          </div>

          {/* CTA Cards */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link
              href="/versus"
              className="group relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-gray-900/80 p-6 sm:p-8 text-center transition-all duration-300 hover:border-red-500/60 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(220,38,38,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="text-4xl mb-3">&#9876;</div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">Versus</h2>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Compara cara a cara a dos candidatos y descubre quién tiene más denuncias
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider group-hover:bg-red-600/30 transition-colors">
                  Comparar ahora
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </Link>

            <Link
              href="/candidato"
              className="group relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/30 to-gray-900/80 p-6 sm:p-8 text-center transition-all duration-300 hover:border-gray-500/60 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(156,163,175,0.08)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="text-4xl mb-3">&#128100;</div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">Candidatos</h2>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Explora los {stats.candidatos} candidatos, sus noticias y nivel de gravedad
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-600/20 text-gray-300 text-xs font-bold uppercase tracking-wider group-hover:bg-gray-600/30 transition-colors">
                  Ver candidatos
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 border-t border-gray-800/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-black mb-10 text-center uppercase tracking-[0.2em] text-gray-400">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-2">
            {faqData.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-800/60 bg-gray-900/50 hover:border-gray-700 transition-colors"
              >
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white list-none flex items-center justify-between gap-4">
                  <span>{item.question}</span>
                  <span className="text-gray-600 group-open:rotate-180 transition-transform duration-200 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed -mt-1">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
