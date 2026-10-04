"use client";

import { useEffect, useState } from "react";

// Polls close at 17:00 Peru time (UTC-5); the exit-poll flash can be published from then on.
const FLASH_AT = Date.parse("2026-10-04T17:00:00-05:00");

function partes(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    horas: Math.floor(total / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

const dos = (n: number) => String(n).padStart(2, "0");

export function FlashCountdown() {
  // null until mounted so server and client render the same markup.
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setAhora(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const restante = ahora === null ? null : FLASH_AT - ahora;
  const terminado = restante !== null && restante <= 0;
  const { horas, minutos, segundos } = partes(restante ?? 0);

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-red-500/30 bg-gray-900/40 px-6 py-4 backdrop-blur-sm sm:mt-8 sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">Flash electoral</p>
      {terminado ? (
        <p className="mt-2 text-xl font-black text-white sm:text-2xl">Cerraron las mesas de votación</p>
      ) : (
        <>
          <p
            className="mt-2 font-mono text-3xl font-black tabular-nums text-white sm:text-4xl"
            role="timer"
            aria-live="off"
          >
            {restante === null ? "--:--:--" : `${dos(horas)}:${dos(minutos)}:${dos(segundos)}`}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">
            Hoy a las 5:00 p. m. (hora de Perú)
          </p>
        </>
      )}
    </div>
  );
}
