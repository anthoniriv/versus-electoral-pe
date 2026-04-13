"use client";

import { useEffect, useState } from "react";
import { FlashElectoralModal } from "./FlashElectoralModal";
import { FLASH_OPEN_EVENT } from "./NewsBanner";

export function FlashElectoralLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function handler() {
      setOpen(true);
    }
    window.addEventListener(FLASH_OPEN_EVENT, handler);
    return () => window.removeEventListener(FLASH_OPEN_EVENT, handler);
  }, []);

  return (
    <>
      <FlashElectoralModal open={open} onClose={() => setOpen(false)} />

      {/* Badge flotante abajo-derecha */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ver flash electoral y conteo en vivo"
        className="fixed z-[80] bottom-4 right-4 sm:bottom-6 sm:right-6 group flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_10px_30px_rgba(220,38,38,0.45)] hover:shadow-[0_16px_44px_rgba(220,38,38,0.6)] hover:scale-[1.03] transition-all animate-pulse-glow"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
          En vivo · ONPE
        </span>
      </button>
    </>
  );
}
