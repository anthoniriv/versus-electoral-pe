import Link from "next/link";
import { ElectionCountdownText } from "./ElectionCountdown";

const MENSAJE =
  "ELECCIONES MUNICIPALES 2026 · 485 CANDIDATOS · LIMA METROPOLITANA Y 42 ALCALDÍAS DISTRITALES · 7,020 PROPUESTAS OFICIALES";

/** One marquee segment: the polling-day reminder followed by the original message. */
function Segment({ compact = false }: { compact?: boolean }) {
  return (
    <span className="pr-8">
      <ElectionCountdownText compact={compact} /> · {MENSAJE} —
    </span>
  );
}

export function MunicipalBanner() {
  return (
    <Link prefetch={false}
      href="/alcaldes"
      aria-label="Explorar candidatos y propuestas para las elecciones municipales 2026"
      className="group relative block w-full overflow-hidden border-b border-red-400/30 bg-gradient-to-r from-red-800 via-red-600 to-red-800 transition hover:brightness-110"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative hidden items-center py-2.5 sm:flex">
        <span className="flex shrink-0 items-center gap-1.5 bg-white px-3 py-1 text-[11px] font-black uppercase leading-none tracking-wider text-red-600">
          Municipal 2026
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          {/* Two identical halves so the loop has no empty gap; the copy is hidden from screen readers. */}
          <p className="animate-marquee inline-block pl-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
            <Segment />
            <span aria-hidden="true"><Segment /></span>
          </p>
        </div>
      </div>
      <div className="relative flex items-center gap-2 py-2 pl-3 sm:hidden">
        <span className="h-2 w-2 shrink-0 rounded-full bg-white" />
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <p className="animate-marquee inline-block text-[11px] font-black uppercase tracking-wider text-white">
            <Segment compact />
            <span aria-hidden="true"><Segment compact /></span>
          </p>
        </div>
      </div>
    </Link>
  );
}
