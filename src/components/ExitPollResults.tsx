"use client";

import Link from "next/link";
import { useState } from "react";
import { CandidatoAvatar } from "@/components/CandidatoAvatar";
import type { ExitPollRowView, ExitPollSourceId, ExitPollSourceView } from "@/lib/exit-poll";

interface ExitPollResultsProps {
  sources: ExitPollSourceView[];
  defaultSource: ExitPollSourceId;
  ambito: string;
}

export const pct = (n: number) => `${n.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export function ExitPollResults({ sources, defaultSource, ambito }: ExitPollResultsProps) {
  const [activeId, setActiveId] = useState<ExitPollSourceId>(
    sources.some((s) => s.id === defaultSource) ? defaultSource : sources[0].id
  );
  const active = sources.find((s) => s.id === activeId) ?? sources[0];

  return (
    <section
      aria-labelledby="exit-poll-title"
      className="mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-900/40 p-4 text-left backdrop-blur-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">Alcaldía de {ambito}</p>
          <h2 id="exit-poll-title" className="mt-1 text-sm font-semibold text-gray-300">
            Top {active.filas.length} · {active.nombre}
          </h2>
        </div>
        {sources.length > 1 && (
          <div role="tablist" aria-label="Fuente de la boca de urna" className="flex rounded-full border border-gray-700 bg-gray-950/60 p-1">
            {sources.map((s) => {
              const selected = s.id === active.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(s.id)}
                  className={`min-h-9 rounded-full px-4 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ${
                    selected ? "bg-red-600 text-white" : "text-gray-400 [@media(hover:hover)_and_(pointer:fine)]:hover:text-white"
                  }`}
                >
                  {s.id === "ipsos" ? "Ipsos" : "Datum"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div role="tabpanel" aria-label={`Resultados de ${active.nombre}`}>
        <ResultRows filas={active.filas} />
      </div>

      <p className="mt-4 border-t border-gray-800 pt-3 text-[11px] leading-relaxed text-gray-500">
        Fuente: {active.nombre}
        {active.medio ? ` para ${active.medio}` : ""}
        {active.corte ? ` · ${active.corte.replace(/\.$/, "")}` : ""}. Boca de urna: estimación por muestreo, no es el resultado oficial.
        {active.url && (
          <>
            {" "}
            <a href={active.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-300">
              Ver publicación original
            </a>
          </>
        )}
      </p>
    </section>
  );
}

/** Ranked rows with photo, party, percentage and a bar relative to the leader. */
export function ResultRows({ filas }: { filas: ExitPollRowView[] }) {
  const max = Math.max(...filas.map((f) => f.porcentaje), 1);
  return (
      <ol className="mt-4 space-y-2">
        {filas.map((fila, i) => {
          const content = (
            <>
              <span className="w-5 shrink-0 text-right text-xs font-bold tabular-nums text-gray-500">{i + 1}</span>
              <CandidatoAvatar
                slug={fila.slug ?? ""}
                nombre={fila.nombre}
                size={36}
                className="shrink-0 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-bold text-white">{fila.nombre}</p>
                  <p className="shrink-0 text-base font-black tabular-nums text-white">{pct(fila.porcentaje)}</p>
                </div>
                {fila.partido && <p className="truncate text-xs text-gray-500">{fila.partido}</p>}
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-800" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-red-500" : "bg-gray-500"}`}
                    style={{ width: `${(fila.porcentaje / max) * 100}%` }}
                  />
                </div>
              </div>
            </>
          );
          return (
            <li key={fila.nombre}>
              {fila.slug ? (
                <Link
                  href={`/alcaldes/${fila.slug}`}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-800/50"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2 py-2">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
  );
}
