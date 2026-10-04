import Link from "next/link";

/**
 * Non-blocking donation prompt. It is meant to sit after content the visitor
 * came for, never as an overlay.
 */
export function SupportCard({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-labelledby="support-card-title"
      className={`rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-gray-900/80 px-4 py-3 sm:p-6 ${className}`}
    >
      {/* Single row on mobile: the full explanation lives on /apoyanos */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 id="support-card-title" className="flex items-center gap-2 text-sm font-black text-white sm:text-lg">
            <svg className="h-4 w-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-6.7-4.35-9.33-8.1C.6 9.9 2.1 5.5 6.06 5.05 8.2 4.8 9.86 6 12 8.1c2.14-2.1 3.8-3.3 5.94-3.05 3.96.45 5.46 4.85 3.39 7.85C18.7 16.65 12 21 12 21z" />
            </svg>
            Este sitio es independiente
          </h2>
          <p className="mt-1.5 hidden text-sm sm:block leading-relaxed text-gray-400">
            Mantener el monitoreo de noticias y los datos del JNE al día tiene costos. Si te sirve para decidir tu voto, ayúdanos a sostenerlo.
          </p>
        </div>
        <Link
          prefetch={false}
          href="/apoyanos"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-red-600 px-4 text-xs sm:px-5 sm:text-sm font-bold uppercase tracking-wider text-white transition-[background-color,transform] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:bg-red-500 active:scale-[0.97]"
        >
          Apóyanos
        </Link>
      </div>
    </aside>
  );
}
