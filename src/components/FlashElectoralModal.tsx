"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FLASH_ELECTORAL, type FlashEncuesta, type OnpeResultado } from "@/lib/flash-electoral";
import { CANDIDATOS } from "@/lib/candidatos";

const CANDIDATO_BY_SLUG = new Map(CANDIDATOS.map((c) => [c.slug, c]));

interface Props {
  open: boolean;
  onClose: () => void;
}

const POLL_MS = 30_000;

function fmtNum(n: number) {
  return n.toLocaleString("es-PE");
}

function avatarUrl(slug: string | null) {
  return slug ? `/candidatos/${slug}.jpg` : "/candidatos/keiko-fujimori.jpg";
}

export function FlashElectoralModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(0);
  const [onpe, setOnpe] = useState<OnpeResultado | null>(null);
  const [loadingOnpe, setLoadingOnpe] = useState(true);
  const [onpeError, setOnpeError] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);

  const totalSlides = 1 + FLASH_ELECTORAL.length;

  const fetchOnpe = useCallback(async () => {
    try {
      const res = await fetch(`/api/onpe/resultados?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const json = await res.json();
      if (!json.success) {
        setOnpeError(true);
      } else {
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
      if (e.key === "ArrowRight") setIndex((i) => Math.min(totalSlides - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, totalSlides]);

  function handleClose() {
    setShow(false);
    setTimeout(onClose, 250);
  }

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(totalSlides - 1, i)));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    setDragX(touchDeltaX.current);
  }
  function onTouchEnd() {
    const w = trackRef.current?.clientWidth ?? 1;
    const threshold = w * 0.18;
    if (touchDeltaX.current > threshold) goTo(index - 1);
    else if (touchDeltaX.current < -threshold) goTo(index + 1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setDragX(0);
  }

  if (!mounted) return null;

  const translate = -(index * 100) + (dragX / (trackRef.current?.clientWidth ?? 1)) * 100;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-2 sm:px-4 pb-2 sm:pb-4 pt-2 sm:pt-4 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      aria-modal="true"
      role="dialog"
      aria-label="Flash electoral y conteo ONPE en vivo"
    >
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-3xl bg-gradient-to-b from-gray-900 via-gray-950 to-black border border-gray-800/80 rounded-2xl sm:rounded-3xl shadow-[0_30px_120px_rgba(220,38,38,0.18)] overflow-hidden transition-all duration-300 ${
          show ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"
        }`}
      >
        {/* Header dinámico */}
        <div
          className={`relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800/80 transition-colors duration-300 ${
            index === 0 ? "bg-gradient-to-r from-red-950/60 via-red-900/30 to-black/40" : "bg-black/40"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <div className="min-w-0">
              {index === 0 ? (
                <>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-red-400 uppercase">
                    🇵🇪 ONPE · Conteo oficial en tiempo real
                  </p>
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    Elecciones Presidenciales 2026 · Actualización automática
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-red-500 uppercase">
                    A boca de urna · Elecciones 2026
                  </p>
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    Flash {FLASH_ELECTORAL[index - 1].encuestadora}
                  </p>
                </>
              )}
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

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 bg-black/30">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir a slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-red-500" : "w-1.5 bg-gray-700 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Swipe track */}
        <div
          ref={trackRef}
          className="relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex"
            style={{
              width: `${totalSlides * 100}%`,
              transform: `translateX(${translate / totalSlides}%)`,
              transition: dragX === 0 ? "transform 350ms cubic-bezier(.2,.8,.2,1)" : "none",
            }}
          >
            {/* Slide 0: ONPE */}
            <div className="shrink-0" style={{ width: `${100 / totalSlides}%` }}>
              <SlideOnpe
                data={onpe}
                loading={loadingOnpe && !onpe}
                error={onpeError && !onpe}
                onRetry={fetchOnpe}
              />
            </div>
            {/* Slides encuestas */}
            {FLASH_ELECTORAL.map((e) => (
              <div key={e.id} className="shrink-0" style={{ width: `${100 / totalSlides}%` }}>
                <SlideEncuesta encuesta={e} active={true} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800/80 bg-black/40">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-gray-800/80 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Anterior
          </button>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium text-center px-2">
            {index === 0 ? (
              onpe ? (
                <>Actualizado: <span className="text-gray-300">{new Date(onpe.actualizado).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span></>
              ) : "Cargando..."
            ) : (
              <>Fuente: <span className="text-gray-300">{FLASH_ELECTORAL[index - 1].medio}</span></>
            )}
          </p>
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === totalSlides - 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-gray-800/80 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SlideOnpe({
  data,
  loading,
  error,
  onRetry,
}: {
  data: OnpeResultado | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const top5 = (data?.candidatos ?? []).slice(0, 5);
  const maxPct = top5[0]?.porcentajeValidos ?? 1;

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 min-h-[420px] sm:min-h-[460px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-red-500 uppercase">🇵🇪 ONPE · Oficial</p>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">Conteo presidencial</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider">
          Tiempo real
        </span>
      </div>

      {loading && <OnpeSkeleton />}

      {error && !loading && (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400 mb-3">No pudimos contactar con ONPE en este momento.</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-600/30 transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <StatBox label="Votos válidos" value={fmtNum(data.totalValidos)} tone="green" />
            <StatBox label="Votos emitidos" value={fmtNum(data.totalEmitidos)} tone="blue" />
            <StatBox label="Blancos/Nulos" value={fmtNum(data.blancos + data.nulos)} tone="gray" />
          </div>

          {/* Top candidatos */}
          <div className="space-y-2.5">
            {top5.map((c, i) => {
              const width = Math.max(4, (c.porcentajeValidos / Math.max(1, maxPct)) * 100);
              const info = c.slug ? CANDIDATO_BY_SLUG.get(c.slug) : undefined;
              const displayName = info?.nombre ?? c.nombre;
              const partido = info?.partido ?? c.partido;
              return (
                <div
                  key={c.slug ?? c.nombre}
                  className="flex items-center gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <img
                    src={avatarUrl(c.slug)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-700 shrink-0 bg-gray-800"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] sm:text-sm font-black text-white truncate leading-tight">
                          {displayName}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 truncate leading-tight">
                          {partido}
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-black text-white tabular-nums shrink-0">
                        {c.porcentajeValidos.toFixed(3)}%
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-400 to-orange-400 animate-bar-grow"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-[10px] text-gray-500 text-center">
            Actualiza automáticamente cada 30s. Fuente:{" "}
            <a
              href="https://resultadoelectoral.onpe.gob.pe/main/presidenciales"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300"
            >
              resultadoelectoral.onpe.gob.pe ↗
            </a>
          </p>
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "gray";
}) {
  const toneMap: Record<string, string> = {
    green: "from-emerald-500/15 to-transparent border-emerald-500/30 text-emerald-300",
    blue: "from-blue-500/15 to-transparent border-blue-500/30 text-blue-300",
    gray: "from-gray-600/15 to-transparent border-gray-500/30 text-gray-300",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${toneMap[tone]} p-2.5 sm:p-3`}>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-80 font-bold">{label}</p>
      <p className="mt-0.5 text-sm sm:text-base font-black text-white tabular-nums">{value}</p>
    </div>
  );
}

function OnpeSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-800/60 animate-shimmer" />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-9 rounded-lg bg-gray-800/60 animate-shimmer" />
      ))}
    </div>
  );
}

function SlideEncuesta({ encuesta, active }: { encuesta: FlashEncuesta; active: boolean }) {
  const max = Math.max(...encuesta.candidatos.map((c) => c.porcentaje));
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 min-h-[420px] sm:min-h-[460px]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: encuesta.accent }}>
            A boca de urna
          </p>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">
            Flash {encuesta.logoLabel}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{encuesta.medio} · {encuesta.fecha}</p>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
          style={{
            backgroundColor: `${encuesta.accent}20`,
            borderColor: `${encuesta.accent}60`,
            color: encuesta.accent,
          }}
        >
          {encuesta.logoLabel}
        </span>
      </div>

      {/* Podio */}
      <div className="flex items-stretch justify-center gap-2 sm:gap-3 h-48 sm:h-56 mb-5">
        {encuesta.candidatos.map((c, i) => {
          const heightPct = 35 + (c.porcentaje / max) * 65;
          return (
            <div
              key={c.slug}
              className="flex-1 flex flex-col items-center justify-end animate-fade-in-up"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="text-[13px] sm:text-base font-black text-white mb-1.5 tabular-nums drop-shadow">
                {c.porcentaje.toFixed(1)}%
              </p>
              <div
                className="w-full rounded-t-xl origin-bottom"
                style={{
                  height: active ? `${heightPct}%` : "0%",
                  minHeight: "40px",
                  background: `linear-gradient(to top, ${c.color}, ${c.color}bb)`,
                  boxShadow: `0 -6px 24px ${c.color}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  transformOrigin: "bottom",
                  animation: active ? `barGrowV 700ms cubic-bezier(.2,.8,.2,1) both` : undefined,
                  animationDelay: `${i * 90}ms`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Nombres con avatar */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${encuesta.candidatos.length}, minmax(0, 1fr))` }}>
        {encuesta.candidatos.map((c, i) => (
          <div
            key={c.slug}
            className="flex flex-col items-center text-center animate-fade-in-up"
            style={{ animationDelay: `${120 + i * 80}ms` }}
          >
            <img
              src={avatarUrl(c.slug)}
              alt={c.nombre}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 shrink-0"
              style={{ borderColor: c.color }}
            />
            <p className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-white leading-tight line-clamp-2">
              {c.nombre.split(" ").slice(0, 2).join(" ")}
            </p>
            <p className="text-[9px] sm:text-[10px] text-gray-500 line-clamp-1 leading-tight">{c.partido}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[10px] text-gray-500 text-center">
        Encuesta a boca de urna · No es resultado oficial
      </p>
    </div>
  );
}
