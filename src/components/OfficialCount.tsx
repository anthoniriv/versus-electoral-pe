"use client";

import { useEffect, useId, useState } from "react";
import { pct, ResultRows } from "@/components/ExitPollResults";
import type { ConteoOficialView } from "@/lib/conteo-oficial";

const PARAM = "distrito";

export function OfficialCount({ conteo }: { conteo: ConteoOficialView }) {
  const selectId = useId();
  const [slug, setSlug] = useState(conteo.ambitos[0].slug);

  // The home page is statically cached, so ?distrito= is read after mount
  // instead of through searchParams, which would make the page dynamic.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(PARAM);
    if (fromUrl && conteo.ambitos.some((a) => a.slug === fromUrl)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(fromUrl);
    }
  }, [conteo.ambitos]);

  const select = (next: string) => {
    setSlug(next);
    const url = new URL(window.location.href);
    if (next === conteo.ambitos[0].slug) url.searchParams.delete(PARAM);
    else url.searchParams.set(PARAM, next);
    window.history.replaceState(null, "", url);
  };

  const ambito = conteo.ambitos.find((a) => a.slug === slug) ?? conteo.ambitos[0];

  return (
    <section
      aria-labelledby="official-count-title"
      className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-red-500/30 bg-gray-900/40 p-4 text-left backdrop-blur-sm sm:mt-8 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">Conteo oficial ONPE</p>
          <h2 id="official-count-title" className="mt-1 text-sm font-semibold text-gray-300">
            {ambito.actasPct === null
              ? "Aún sin actas contabilizadas"
              : `Actas contabilizadas: ${pct(ambito.actasPct)}`}
          </h2>
        </div>
        <div>
          <label htmlFor={selectId} className="sr-only">
            Elige la alcaldía
          </label>
          <select
            id={selectId}
            value={ambito.slug}
            onChange={(e) => select(e.target.value)}
            className="min-h-10 max-w-[16rem] rounded-full border border-gray-700 bg-gray-950 px-4 text-sm font-bold text-white"
          >
            {conteo.ambitos.map((a, i) => (
              <option key={a.slug} value={a.slug}>
                {i === 0 ? a.nombre : `${a.nombre}${a.actasPct === null ? " (pendiente)" : ""}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ambito.filas.length > 0 ? (
        <ResultRows filas={ambito.filas} />
      ) : (
        <p className="mt-4 rounded-xl bg-gray-950/50 px-4 py-6 text-center text-sm text-gray-400">
          Estamos cargando el conteo de {ambito.nombre}. Vuelve en unos minutos.
        </p>
      )}

      <p className="mt-4 border-t border-gray-800 pt-3 text-[11px] leading-relaxed text-gray-500">
        Fuente: ONPE, resultados de actas contabilizadas
        {conteo.actualizado ? ` · Actualizado ${conteo.actualizado.replace(/\.$/, "")}` : ""}. Porcentajes sobre
        votos válidos.{" "}
        <a
          href="https://resultadoelectoral.onpe.gob.pe"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-300"
        >
          Ver en la ONPE
        </a>
      </p>
    </section>
  );
}
