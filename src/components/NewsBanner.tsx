import { CANDIDATOS } from "@/lib/candidatos";
import { prisma } from "@/lib/db";

async function getNewsCount(): Promise<number> {
  try {
    return await prisma.noticia.count();
  } catch {
    return Number(process.env.NEXT_PUBLIC_HOME_NEWS_COUNT || "1756");
  }
}

export async function NewsBanner() {
  const candidatos = CANDIDATOS.length;
  const fuentes = 20;
  const noticias = await getNewsCount();

  return (
    <div className="bg-red-600/90 overflow-hidden border-b border-red-500/30">
      <div className="flex items-center h-9">
        <span className="bg-white text-red-600 px-3 py-1 text-[11px] font-black uppercase shrink-0 tracking-wider">
          En vivo
        </span>
        <div className="overflow-hidden whitespace-nowrap flex-1 hidden sm:block">
          <p className="animate-marquee inline-block text-[11px] font-semibold text-white/95 pl-4 tracking-wide">
            VERSUS ELECTORAL PERÚ 2026 — Monitoreo automático de {candidatos} candidatos presidenciales — {noticias.toLocaleString()} noticias analizadas de {fuentes} fuentes periodísticas — Actualización automática cada 12 horas (00:00 y 12:00 hrs)
          </p>
        </div>
        <div className="sm:hidden flex-1 overflow-hidden">
          <p className="text-[11px] font-semibold text-white/95 px-3 truncate text-center">
            {candidatos} candidatos • {noticias.toLocaleString()} noticias • actualización cada 12h
          </p>
        </div>
      </div>
    </div>
  );
}
