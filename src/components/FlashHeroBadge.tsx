"use client";

import { FLASH_OPEN_EVENT } from "./NewsBanner";

export function FlashHeroBadge() {
  function open() {
    window.dispatchEvent(new CustomEvent(FLASH_OPEN_EVENT));
  }

  return (
    <button
      onClick={open}
      aria-label="Abrir flash electoral y conteo ONPE en vivo"
      className="group inline-flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 mb-4 rounded-full border border-red-500/40 bg-gradient-to-r from-red-950/80 via-red-900/70 to-red-950/80 backdrop-blur-md shadow-[0_8px_24px_rgba(220,38,38,0.35)] hover:border-red-400/70 hover:scale-[1.03] transition-all animate-fade-in"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-white whitespace-nowrap">
        <span className="text-red-400">EN VIVO</span>
        <span className="text-white/90"> · Flash electoral + ONPE</span>
      </span>
      <svg
        className="w-3 h-3 text-red-300 group-hover:translate-x-0.5 transition-transform shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
