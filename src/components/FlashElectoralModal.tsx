"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type {
  OnpeCandidato,
  OnpeResultado,
  BocaUrnaEncuestadora,
  BocaUrnaCandidato,
} from "@/lib/flash-electoral";
import { BOCA_URNA_2V } from "@/lib/flash-electoral";
import { CANDIDATOS } from "@/lib/candidatos";

const VersusFlag3D = dynamic(
  () => import("./VersusFlag3D").then((m) => m.VersusFlag3D),
  { ssr: false }
);

const CANDIDATO_BY_SLUG = new Map(CANDIDATOS.map((c) => [c.slug, c]));

interface PartidoMeta {
  logo: string;
  color: string;
  coinColor: string;
  bgGradient: string;
  abbr: string;
}

const PARTIDO_BY_SLUG: Record<string, PartidoMeta> = {
  "keiko-fujimori": {
    logo: "/partidos/fuerza-popular.png",
    color: "#F59E0B",
    coinColor: "#1a0f02",
    bgGradient:
      "linear-gradient(135deg, rgba(245,158,11,0.30) 0%, rgba(194,65,12,0.28) 50%, rgba(120,53,15,0.32) 100%)",
    abbr: "FP",
  },
  "roberto-sanchez-palomino": {
    logo: "/partidos/juntos-por-el-peru.png",
    color: "#16A34A",
    coinColor: "#02160b",
    bgGradient:
      "linear-gradient(135deg, rgba(22,163,74,0.30) 0%, rgba(21,128,61,0.28) 50%, rgba(6,78,59,0.32) 100%)",
    abbr: "JP",
  },
};

const FALLBACK_PARTIDO: PartidoMeta = {
  logo: "/ic_candidate.svg",
  color: "#6B7280",
  coinColor: "#111111",
  bgGradient:
    "linear-gradient(135deg, rgba(107,114,128,0.18) 0%, transparent 100%)",
  abbr: "?",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const POLL_MS = 15_000;

// Kill-switch del conteo ONPE en vivo. Combínalo con la heurística de
// "2 candidatos": aunque esté en true, el tab ONPE solo aparece cuando el
// endpoint devuelve la 2da vuelta. Ponlo en false para forzar solo boca de urna.
const ONPE_LIVE_ENABLED = true;

function fmtNum(n: number) {
  return n.toLocaleString("es-PE");
}

function avatarUrl(slug: string | null) {
  return slug ? `/candidatos/${slug}.jpg` : "/candidatos/keiko-fujimori.jpg";
}

const SHORT_NAME_BY_SLUG: Record<string, string> = {
  "keiko-fujimori": "Keiko Fujimori",
  "roberto-sanchez-palomino": "Roberto Sánchez",
};

function shortName(slug: string | null, full: string) {
  if (slug && SHORT_NAME_BY_SLUG[slug]) return SHORT_NAME_BY_SLUG[slug];
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 2) return full.trim();
  // primer nombre + primer apellido (penúltimo token suele ser el paterno)
  return `${parts[0]} ${parts[parts.length - 2]}`;
}

export function FlashElectoralModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [onpe, setOnpe] = useState<OnpeResultado | null>(null);
  const [loadingOnpe, setLoadingOnpe] = useState(true);
  const [onpeError, setOnpeError] = useState(false);

  // tab activo: "onpe" (conteo oficial, por defecto) | id de encuestadora
  const [tab, setTab] = useState<string>("onpe");

  const fetchOnpe = useCallback(async () => {
    try {
      const res = await fetch(`/api/onpe/resultados?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const json = await res.json();
      if (!json.success) setOnpeError(true);
      else {
        setOnpe(json);
        setOnpeError(false);
      }
    } catch {
      setOnpeError(true);
    } finally {
      setLoadingOnpe(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchOnpe();
    const id = setInterval(fetchOnpe, POLL_MS);
    function onVisible() {
      if (document.visibilityState === "visible") fetchOnpe();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fetchOnpe);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fetchOnpe);
    };
  }, [open, fetchOnpe]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
      document.body.style.overflow = "";
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setShow(false);
    setTimeout(onClose, 250);
  }

  // 2da vuelta = exactamente 2 candidatos. El conteo se considera "iniciado"
  // cuando ya hay actas contabilizadas; si no, mostramos "esperando datos".
  const nCand = onpe?.candidatos.length ?? 0;
  const onpeEsSegundaVuelta = nCand > 0 && nCand <= 2;
  const conteoIniciado =
    ONPE_LIVE_ENABLED &&
    onpeEsSegundaVuelta &&
    (onpe?.actasContabilizadas ?? 0) > 0;

  if (!mounted) return null;

  const top2 = onpe?.candidatos.slice(0, 2) ?? [];
  const left = top2[0];
  const right = top2[1];
  const conteoCompleto = (onpe?.actasContabilizadasPct ?? 0) >= 99.9;

  const isOnpeTab = tab === "onpe";
  const encActiva =
    BOCA_URNA_2V.find((e) => e.id === tab) ?? BOCA_URNA_2V[0];

  function pickTab(id: string) {
    setTab(id);
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-2 sm:px-4 pb-2 sm:pb-4 pt-2 sm:pt-4 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      aria-modal="true"
      role="dialog"
      aria-label="Boca de urna y conteo ONPE — segunda vuelta 2026"
    >
      <div
        className={`absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-5xl bg-gradient-to-b from-gray-900 via-gray-950 to-black border border-gray-800/80 rounded-2xl sm:rounded-3xl shadow-[0_30px_120px_rgba(220,38,38,0.25)] overflow-hidden transition-all duration-300 ${
          show ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800/80 bg-gradient-to-r from-red-950/60 via-black/40 to-emerald-950/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-red-400 uppercase">
                {isOnpeTab
                  ? "🇵🇪 ONPE · Conteo en vivo · 2da vuelta"
                  : "🚨 Flash · Boca de urna · 2da vuelta"}
              </p>
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {isOnpeTab ? (
                  !onpe ? (
                    "Cargando resultados…"
                  ) : !conteoIniciado ? (
                    <span className="text-amber-400">
                      ⏳ Esperando inicio del conteo · 2da vuelta
                    </span>
                  ) : conteoCompleto ? (
                    <>
                      <span className="text-emerald-400">✓ Conteo finalizado al 100%</span>
                      {" · Elecciones 2026"}
                    </>
                  ) : (
                    <>
                      Conteo al{" "}
                      <span className="text-red-400">
                        {onpe.actasContabilizadasPct.toFixed(3)}%
                      </span>{" "}
                      · Elecciones 2026
                    </>
                  )
                ) : (
                  <>
                    {encActiva.nombre}
                    <span className="text-gray-400 font-medium">
                      {" · "}
                      {encActiva.medio}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800/80 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs: ONPE conteo oficial (principal) + boca de urna */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 border-b border-gray-800/80 bg-black/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => pickTab("onpe")}
            aria-pressed={isOnpeTab}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border transition ${
              isOnpeTab
                ? "bg-red-600/25 border-red-500/70 text-white"
                : "text-red-300 border-red-700/60 hover:border-red-500/80"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            ONPE en vivo
          </button>

          <span className="shrink-0 h-4 w-px bg-gray-700/70 mx-0.5" aria-hidden />

          <span className="shrink-0 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500 mr-0.5">
            Boca de urna
          </span>

          {BOCA_URNA_2V.map((e) => {
            const active = !isOnpeTab && tab === e.id;
            return (
              <button
                key={e.id}
                onClick={() => pickTab(e.id)}
                aria-pressed={active}
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border transition ${
                  active
                    ? "text-white"
                    : "text-gray-400 border-gray-700/70 hover:text-gray-200 hover:border-gray-500/70"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: `${e.accent}26`,
                        borderColor: `${e.accent}88`,
                        color: "#fff",
                      }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: e.accent }}
                />
                {e.label}
                {e.pending && (
                  <span className="text-[8px] sm:text-[9px] font-bold text-amber-400/90 normal-case tracking-normal">
                    pronto
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────── FASE BOCA DE URNA ─────────── */}
        {!isOnpeTab && <BocaUrnaView enc={encActiva} />}

        {/* ─────────── CONTEO ONPE OFICIAL (principal) ─────────── */}
        {isOnpeTab && (
          <>
            {loadingOnpe && !onpe && <VersusSkeleton />}

            {onpeError && !onpe && (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-gray-400 mb-3">
                  No pudimos contactar con ONPE en este momento.
                </p>
                <button
                  onClick={fetchOnpe}
                  className="px-4 py-2 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-600/30 transition"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Barra de stats oficiales: actas, votos, participación */}
            {onpe && <OnpeStatsBar onpe={onpe} />}

            {/* Conteo aún en 0 → esperando nuevos datos */}
            {onpe && !conteoIniciado && <OnpeWaiting onpe={onpe} />}

            {conteoIniciado && left && right && (
              <div className="relative">
                {/* VS central */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-red-500/30 blur-2xl animate-pulse-glow" />
                    <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-black border-2 border-red-500/60 shadow-[0_10px_40px_rgba(220,38,38,0.6)] flex items-center justify-center">
                      <span className="text-2xl lg:text-3xl font-black text-white drop-shadow-lg italic tracking-tighter">
                        VS
                      </span>
                    </div>
                  </div>
                </div>

                {/* VS móvil centrado entre ambas mitades */}
                <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-red-500/40 blur-xl animate-pulse-glow" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-black border-2 border-red-500/60 flex items-center justify-center">
                      <span className="text-base font-black text-white italic tracking-tighter">
                        VS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 relative">
                  <VersusSide cand={left} side="left" lead onNavigate={handleClose} />
                  <VersusSide cand={right} side="right" onNavigate={handleClose} />
                </div>

                {/* Banner resultado oficial 2da vuelta */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-950/40 via-emerald-950/30 to-black/40 border-t border-gray-800/80 text-center">
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-400">
                    {conteoCompleto ? "🏆 Resultados oficiales finales" : "⚡ Resultados en vivo"}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-300 font-medium">
                    Segunda vuelta presidencial · ONPE 2026 ·{" "}
                    <span className="font-black text-white">
                      {shortName(left.slug, left.nombre)}
                    </span>{" "}
                    vs{" "}
                    <span className="font-black text-white">
                      {shortName(right.slug, right.nombre)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800/80 bg-black/40">
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            {isOnpeTab ? (
              onpe ? (
                <>
                  Actualizado:{" "}
                  <span className="text-gray-300">
                    {new Date(onpe.actualizado).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>{" "}
                  · Auto-refresh cada 15s
                </>
              ) : (
                "—"
              )
            ) : (
              <>
                Boca de urna · {encActiva.fecha}
                {!conteoIniciado && " · esperando conteo ONPE…"}
              </>
            )}
          </p>
          <a
            href="https://resultadoelectoral.onpe.gob.pe/main/presidenciales"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-[11px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
          >
            ONPE ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// FASE BOCA DE URNA — split naranja/verde estilo flash TV
// ───────────────────────────────────────────────────────────────

function BocaUrnaView({ enc }: { enc: BocaUrnaEncuestadora }) {
  const [keiko, sanchez] = enc.candidatos;
  const pending =
    enc.pending || keiko.porcentaje == null || sanchez.porcentaje == null;

  if (pending) {
    return (
      <div key={enc.id} className="relative animate-fade-in">
        <div className="grid grid-cols-2">
          <BocaPendingSide cand={keiko} side="left" />
          <BocaPendingSide cand={sanchez} side="right" />
        </div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black/50 border-t border-gray-800/80 text-center">
          <p className="text-[11px] sm:text-sm font-black uppercase tracking-[0.18em] text-amber-400">
            ⏳ {enc.label} aún no publica su boca de urna
          </p>
          <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
            Resultados disponibles pronto · {enc.fecha}
          </p>
        </div>
      </div>
    );
  }

  const ganador =
    (keiko.porcentaje ?? 0) >= (sanchez.porcentaje ?? 0) ? "left" : "right";

  return (
    <div key={enc.id} className="relative animate-fade-in">
      <div className="grid grid-cols-2 relative">
        <BocaSide cand={keiko} side="left" lead={ganador === "left"} />
        <BocaSide cand={sanchez} side="right" lead={ganador === "right"} />
      </div>

      {/* Banner BOCA DE URNA + encuestadora */}
      <div
        className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 border-t border-gray-800/80"
        style={{
          background: `linear-gradient(90deg, ${enc.accent}22, rgba(0,0,0,0.5) 50%, ${enc.accent}22)`,
        }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] border"
          style={{
            backgroundColor: `${enc.accent}26`,
            borderColor: `${enc.accent}88`,
            color: "#fff",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: enc.accent }} />
          {enc.label}
        </span>
        <span className="text-[11px] sm:text-sm font-black uppercase tracking-[0.22em] text-white">
          🚨 Boca de urna
        </span>
      </div>
    </div>
  );
}

function BocaSide({
  cand,
  side,
  lead,
}: {
  cand: BocaUrnaCandidato;
  side: "left" | "right";
  lead?: boolean;
}) {
  const mirror = side === "right";
  const pct = cand.porcentaje ?? 0;

  return (
    <div
      className={`relative px-2 sm:px-6 pt-4 sm:pt-7 pb-3 sm:pb-6 overflow-hidden min-h-[18rem] sm:min-h-[24rem] flex flex-col ${
        mirror ? "border-l border-gray-800/80" : ""
      }`}
      style={{
        background: `linear-gradient(${mirror ? "225deg" : "135deg"}, ${cand.color}3d 0%, ${cand.color}1f 55%, rgba(0,0,0,0.35) 100%)`,
      }}
    >
      {/* glow */}
      <div
        className="absolute inset-0 pointer-events-none blur-3xl opacity-60"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${cand.color}88, transparent 60%)`,
        }}
      />

      {/* badge ganador + logo partido */}
      <div
        className={`relative z-10 flex items-center gap-1.5 mb-2 ${
          mirror ? "justify-end" : ""
        }`}
      >
        {lead && (
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[11px] font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] border bg-amber-500/15 border-amber-500/50 text-amber-300">
            👑 Lidera
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cand.logo}
          alt={cand.partido}
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-md object-contain bg-white/10 p-0.5"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      </div>

      {/* foto candidato con fade-in */}
      <div
        className={`relative z-10 flex justify-center ${mirror ? "sm:justify-end" : "sm:justify-start"}`}
      >
        <div className="relative">
          <div
            className="absolute -inset-2 rounded-2xl blur-xl opacity-60"
            style={{ background: cand.color }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cand.foto}
            alt={cand.nombre}
            className="relative h-28 sm:h-44 w-auto object-cover rounded-xl border-2 animate-fade-in"
            style={{ borderColor: cand.color }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        </div>
      </div>

      {/* % grande */}
      <div className={`relative z-10 mt-auto pt-3 text-center ${mirror ? "sm:text-right" : "sm:text-left"}`}>
        <p
          className="text-4xl sm:text-7xl font-black tabular-nums leading-none drop-shadow-lg"
          style={{
            color: "#fff",
            textShadow: `0 0 30px ${cand.color}cc`,
          }}
        >
          {pct.toFixed(2)}
          <span className="text-xl sm:text-4xl ml-0.5 sm:ml-1">%</span>
        </p>
        <p className="mt-1 text-[11px] sm:text-base font-black text-white uppercase tracking-wide leading-tight truncate">
          {cand.nombre}
        </p>
        <p
          className="text-[9px] sm:text-xs font-bold truncate leading-tight"
          style={{ color: cand.color }}
        >
          {cand.partido}
        </p>
      </div>

      {/* barra */}
      <div className="relative z-10 mt-2 sm:mt-3 h-1.5 sm:h-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className={`h-full rounded-full animate-bar-grow ${mirror ? "ml-auto" : ""}`}
          style={{
            width: `${Math.max(2, Math.min(100, pct))}%`,
            background: `linear-gradient(to right, ${cand.color}, ${cand.color}aa)`,
            boxShadow: `0 0 14px ${cand.color}99`,
          }}
        />
      </div>
    </div>
  );
}

function BocaPendingSide({
  cand,
  side,
}: {
  cand: BocaUrnaCandidato;
  side: "left" | "right";
}) {
  const mirror = side === "right";
  return (
    <div
      className={`relative px-2 sm:px-6 pt-4 sm:pt-7 pb-3 sm:pb-6 overflow-hidden min-h-[18rem] sm:min-h-[24rem] flex flex-col items-center justify-center ${
        mirror ? "border-l border-gray-800/80" : ""
      }`}
      style={{
        background: `linear-gradient(${mirror ? "225deg" : "135deg"}, ${cand.color}26 0%, rgba(0,0,0,0.4) 100%)`,
      }}
    >
      <div className="relative">
        <div
          className="absolute -inset-2 rounded-2xl blur-xl opacity-30"
          style={{ background: cand.color }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cand.foto}
          alt={cand.nombre}
          className="relative h-24 sm:h-36 w-auto object-cover rounded-xl border-2 grayscale opacity-60"
          style={{ borderColor: `${cand.color}88` }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      </div>
      <p className="mt-3 text-[11px] sm:text-base font-black text-white/80 uppercase tracking-wide text-center">
        {cand.nombre}
      </p>
      <p className="mt-2 text-2xl sm:text-4xl font-black text-gray-600 tabular-nums animate-pulse">
        — %
      </p>
    </div>
  );
}

// Barra de stats oficiales ONPE: actas, votos, participación
function OnpeStatsBar({ onpe }: { onpe: OnpeResultado }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-gray-800/80 border-b border-gray-800/80 bg-black/30">
      <OnpeStat
        label="Actas contabilizadas"
        value={`${onpe.actasContabilizadasPct.toFixed(3)}%`}
        sub={`${fmtNum(onpe.actasContabilizadas)} / ${fmtNum(onpe.totalActas)}`}
      />
      <OnpeStat
        label="Votos válidos"
        value={fmtNum(onpe.totalValidos)}
        sub={`${fmtNum(onpe.totalEmitidos)} emitidos`}
      />
      <OnpeStat
        label="Participación"
        value={`${onpe.participacionCiudadana.toFixed(1)}%`}
        sub="ciudadana"
      />
    </div>
  );
}

function OnpeStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="px-2 sm:px-4 py-2.5 sm:py-3 text-center">
      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 leading-tight">
        {label}
      </p>
      <p className="mt-0.5 text-sm sm:text-xl font-black text-white tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-0.5 text-[8px] sm:text-[10px] text-gray-400 font-medium tabular-nums truncate">
        {sub}
      </p>
    </div>
  );
}

// Estado "esperando nuevos datos" — conteo oficial aún en 0
function OnpeWaiting({ onpe }: { onpe: OnpeResultado }) {
  return (
    <div className="relative px-4 sm:px-8 py-7 sm:py-10 text-center animate-fade-in overflow-hidden">
      <div className="absolute inset-0 pointer-events-none blur-3xl opacity-40 bg-[radial-gradient(circle_at_50%_30%,rgba(220,38,38,0.4),transparent_60%)]" />

      <div className="relative">
        <span className="relative inline-flex h-3 w-3 mb-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
        </span>
        <p className="text-lg sm:text-2xl font-black text-white">
          ⏳ Esperando nuevos datos
        </p>
        <p className="mt-1.5 text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
          El conteo oficial de ONPE aún no inicia. Esta vista se actualiza sola
          cada 15 segundos — apenas entren actas verás el resultado aquí.
        </p>

        {/* candidatos confirmados a 0.00% */}
        <div className="mt-5 sm:mt-7 grid grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto">
          {onpe.candidatos.map((c) => {
            const partido =
              (c.slug && PARTIDO_BY_SLUG[c.slug]) || FALLBACK_PARTIDO;
            return (
              <div
                key={c.slug ?? c.nombre}
                className="relative flex flex-col items-center gap-2 rounded-2xl border p-3 sm:p-4"
                style={{
                  borderColor: `${partido.color}44`,
                  background: `linear-gradient(180deg, ${partido.color}1f, transparent)`,
                }}
              >
                <div className="relative">
                  <div
                    className="absolute -inset-1 rounded-full blur-md opacity-60"
                    style={{ background: partido.color }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl(c.slug)}
                    alt={c.nombre}
                    className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 bg-gray-800"
                    style={{ borderColor: partido.color }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                </div>
                <p className="text-[11px] sm:text-sm font-black text-white leading-tight">
                  {shortName(c.slug, c.nombre)}
                </p>
                <p
                  className="text-2xl sm:text-4xl font-black tabular-nums leading-none"
                  style={{ color: partido.color }}
                >
                  0.00<span className="text-sm sm:text-xl">%</span>
                </p>
                <p className="text-[9px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                  0 votos
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-[11px] sm:text-xs text-gray-400">
          Mientras tanto, revisa la{" "}
          <span className="text-red-400 font-bold">boca de urna</span> (Datum ·
          Ipsos) en las pestañas de arriba.
        </p>
      </div>
    </div>
  );
}

function VersusSide({
  cand,
  side,
  lead,
  onNavigate,
}: {
  cand: OnpeCandidato;
  side: "left" | "right";
  lead?: boolean;
  onNavigate?: () => void;
}) {
  const info = cand.slug ? CANDIDATO_BY_SLUG.get(cand.slug) : undefined;
  const partido =
    (cand.slug && PARTIDO_BY_SLUG[cand.slug]) || FALLBACK_PARTIDO;
  const displayName = info?.nombre ?? cand.nombre;
  const partidoNombre = info?.partido ?? cand.partido;
  const mirror = side === "right";

  return (
    <div
      className={`relative px-2 sm:px-6 py-4 sm:py-7 overflow-hidden ${
        mirror ? "border-l border-gray-800/80" : ""
      }`}
    >
      {/* tinte color partido — cubre toda la mitad */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: partido.bgGradient }}
      />
      {/* glow detrás de la moneda (zona superior) */}
      <div
        className="absolute inset-0 pointer-events-none blur-3xl opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${partido.color}77, transparent 60%)`,
        }}
      />
      {/* glow zona inferior (debajo del %) */}
      <div
        className="absolute inset-0 pointer-events-none blur-3xl opacity-55"
        style={{
          background: `radial-gradient(circle at 50% 85%, ${partido.color}66, transparent 65%)`,
        }}
      />
      {/* glow lateral hacia el centro del modal */}
      <div
        className="absolute -inset-16 pointer-events-none blur-2xl opacity-50"
        style={{
          background: `radial-gradient(ellipse at ${mirror ? "0%" : "100%"} 50%, ${partido.color}99, transparent 60%)`,
        }}
      />

      {/* three.js full-bleed: partículas cubren toda la mitad, moneda anclada arriba */}
      <div className="absolute inset-0 pointer-events-none">
        <VersusFlag3D
          logoUrl={partido.logo}
          color={partido.color}
          coinColor={partido.coinColor}
          mirror={mirror}
        />
      </div>

      {/* badge ganador / segundo */}
      <div
        className={`relative flex items-center gap-1.5 mb-2 sm:mb-3 ${mirror ? "justify-end md:justify-end" : ""}`}
      >
        <span
          className={`inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[11px] font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] border ${
            lead
              ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
              : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
          }`}
        >
          {lead ? "👑 1°" : "🥈 2°"}
        </span>
        <span
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-black tracking-widest"
          style={{
            backgroundColor: `${partido.color}22`,
            color: partido.color,
            border: `1px solid ${partido.color}55`,
          }}
        >
          {partido.abbr}
        </span>
      </div>

      {/* spacer reserva espacio donde se ancla la moneda 3D (canvas full-bleed) */}
      <div className="relative h-28 sm:h-52 md:h-64" aria-hidden />

      {/* foto + nombre — vertical en mobile, horizontal desktop */}
      <div
        className={`relative flex flex-col md:flex-row items-center md:gap-3 mt-2 md:mt-3 text-center md:text-left ${mirror ? "md:flex-row-reverse md:text-right" : ""}`}
      >
        <div className="relative shrink-0">
          <div
            className="absolute -inset-1 rounded-full blur-md opacity-70"
            style={{ background: partido.color }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl(cand.slug)}
            alt={displayName}
            className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-full object-cover border-2 shrink-0 bg-gray-800"
            style={{ borderColor: partido.color }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        </div>
        <div className="min-w-0 flex-1 mt-1 md:mt-0">
          <p className="text-[11px] sm:text-lg font-black text-white truncate leading-tight">
            {shortName(cand.slug, displayName)}
          </p>
          <p
            className="text-[9px] sm:text-xs font-bold truncate leading-tight"
            style={{ color: partido.color }}
          >
            {partidoNombre}
          </p>
        </div>
      </div>

      {/* % grande */}
      <div className={`relative mt-3 sm:mt-4 text-center md:text-left ${mirror ? "md:text-right" : ""}`}>
        <p
          className="text-3xl sm:text-6xl md:text-7xl font-black tabular-nums leading-none drop-shadow-lg"
          style={{
            color: partido.color,
            textShadow: `0 0 30px ${partido.color}55`,
          }}
        >
          {cand.porcentajeValidos.toFixed(2)}
          <span className="text-lg sm:text-3xl ml-0.5 sm:ml-1">%</span>
        </p>
        <p className="mt-1 sm:mt-1.5 text-[9px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider tabular-nums">
          {fmtNum(cand.votos)} votos
        </p>
      </div>

      {/* barra */}
      <div className="relative mt-2 sm:mt-3 h-1.5 sm:h-2 rounded-full bg-gray-800/80 overflow-hidden">
        <div
          className="h-full rounded-full animate-bar-grow"
          style={{
            width: `${Math.max(2, Math.min(100, cand.porcentajeValidos))}%`,
            background: `linear-gradient(to right, ${partido.color}, ${partido.color}aa)`,
            boxShadow: `0 0 14px ${partido.color}99`,
          }}
        />
      </div>

      {/* CTA */}
      <Link
        href={`/candidato/${cand.slug ?? ""}`}
        onClick={onNavigate}
        className={`relative mt-3 sm:mt-5 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider border transition hover:scale-[1.03] w-full ${
          mirror ? "md:float-right md:w-auto" : "md:w-auto"
        }`}
        style={{
          color: partido.color,
          borderColor: `${partido.color}66`,
          backgroundColor: `${partido.color}15`,
        }}
      >
        Más información
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}

function VersusSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="px-6 py-7 space-y-3">
          <div className="h-5 w-20 rounded bg-gray-800 animate-shimmer" />
          <div className="h-40 sm:h-48 rounded-xl bg-gray-800/60 animate-shimmer" />
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-800 animate-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-gray-800 animate-shimmer" />
              <div className="h-3 w-1/2 rounded bg-gray-800/70 animate-shimmer" />
            </div>
          </div>
          <div className="h-14 w-40 rounded bg-gray-800/60 animate-shimmer" />
          <div className="h-2 rounded-full bg-gray-800 animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
