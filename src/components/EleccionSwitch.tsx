"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ELECCIONES, eleccionFromPath } from "@/lib/elecciones";

/**
 * Switch global de elección. La elección activa se deduce del pathname, así que
 * no hay estado que sincronizar y las páginas siguen siendo estáticas (ISR).
 */
export function EleccionSwitch() {
  const pathname = usePathname() ?? "/";
  const activa = eleccionFromPath(pathname);

  return (
    <div
      role="tablist"
      aria-label="Elección"
      className="flex items-center gap-0.5 rounded-full border border-gray-800 bg-black/50 p-0.5"
    >
      {ELECCIONES.map((e) => {
        const active = e.id === activa;
        return (
          <Link prefetch={false}
            key={e.id}
            href={e.listaPath}
            role="tab"
            aria-selected={active}
            className={`relative px-2.5 sm:px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition ${
              active
                ? "bg-red-600 text-white shadow-[0_2px_12px_rgba(220,38,38,0.5)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {e.label}
            {!e.conDatos && (
              <span className="ml-1 text-[8px] font-bold text-amber-400 normal-case tracking-normal">
                pronto
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
