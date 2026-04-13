"use client";

export const FLASH_OPEN_EVENT = "flash-electoral:open";

export function NewsBanner() {
  function open() {
    window.dispatchEvent(new CustomEvent(FLASH_OPEN_EVENT));
  }

  const message =
    "FLASH ELECTORAL EN VIVO · Resultados a boca de urna de Datum, Ipsos y Panamericana · Conteo oficial ONPE actualizado en tiempo real · Click para ver";

  return (
    <button
      onClick={open}
      aria-label="Abrir flash electoral y conteo ONPE en vivo"
      className="w-full group relative block bg-gradient-to-r from-red-700 via-red-600 to-red-700 overflow-hidden border-b border-red-400/40 hover:brightness-110 transition cursor-pointer"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Desktop: marquee */}
      <div className="hidden sm:flex items-center py-2.5 relative">
        <span className="flex items-center gap-1.5 bg-white text-red-600 px-3 py-1 text-[11px] leading-none font-black uppercase shrink-0 tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          En vivo
        </span>
        <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center">
          <p
            className="animate-marquee inline-block text-[11px] font-bold uppercase text-white tracking-[0.12em] pl-4"
            style={{ lineHeight: "1" }}
          >
            {message} — {message}
          </p>
        </div>
      </div>

      {/* Mobile: centrado */}
      <div className="sm:hidden flex items-center justify-center gap-2 py-2 relative">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <p className="text-[11px] leading-none font-black uppercase tracking-wider text-white truncate">
          En vivo · Flash electoral + ONPE
        </p>
      </div>
    </button>
  );
}
