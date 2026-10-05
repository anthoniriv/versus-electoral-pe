"use client";

import { useState, type CSSProperties } from "react";
import { CandidatoAvatar } from "@/components/CandidatoAvatar";
import { SmartlinkLink } from "@/components/SmartlinkLink";
import { colorPartido } from "@/lib/partido-colores";
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

const numero = (n: number) => n.toLocaleString("es-PE");

/**
 * Ranked rows with photo, party colour, percentage and a bar relative to the
 * leader. Bars grow from the left on first paint (@starting-style), staggered,
 * and retarget smoothly when the numbers change.
 */
export function ResultRows({ filas }: { filas: ExitPollRowView[] }) {
  const max = Math.max(...filas.map((f) => f.porcentaje), 1);
  return (
    <ol className="mt-4 space-y-1.5">
      {filas.map((fila, i) => {
        const color = colorPartido(fila.partido);
        const lider = i === 0;
        const content = (
          <>
            <span className="w-5 shrink-0 text-right text-xs font-bold tabular-nums text-gray-500">{i + 1}</span>
            <span
              className="shrink-0 rounded-full p-[2px]"
              style={{ background: lider ? color : `${color}55` }}
            >
              <CandidatoAvatar
                slug={fila.foto ?? ""}
                nombre={fila.nombre}
                size={lider ? 44 : 36}
                className="block rounded-full bg-gray-950"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={`line-clamp-2 font-bold leading-tight text-white ${lider ? "text-base" : "text-sm"}`}>{fila.nombre}</p>
                <p className={`shrink-0 font-black tabular-nums text-white ${lider ? "text-xl" : "text-base"}`}>
                  {pct(fila.porcentaje)}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <p className="flex min-w-0 items-center gap-1.5 text-gray-400">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                  <span className="truncate">{fila.partido ?? "Sin partido registrado"}</span>
                </p>
                {fila.votos !== null && (
                  <p className="shrink-0 tabular-nums text-gray-500">{numero(fila.votos)} votos</p>
                )}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-800/80" aria-hidden="true">
                <div
                  className="h-full origin-left scale-x-(--share) rounded-full transition-[scale] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-x-0 motion-reduce:transition-none"
                  style={
                    {
                      background: color,
                      "--share": fila.porcentaje / max,
                      transitionDelay: `${i * 40}ms`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          </>
        );
        const rowClass = "flex items-center gap-3 rounded-xl px-2 py-2";
        const rowStyle = lider ? { background: `linear-gradient(90deg, ${color}1f, transparent 70%)` } : undefined;
        return (
          <li key={fila.nombre}>
            {fila.slug ? (
              <SmartlinkLink
                href={`/alcaldes/${fila.slug}`}
                prefetch={false}
                style={rowStyle}
                className={`${rowClass} transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-800/50`}
              >
                {content}
              </SmartlinkLink>
            ) : (
              <div style={rowStyle} className={rowClass}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
