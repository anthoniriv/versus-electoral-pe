"use client";

import { useMemo, useState } from "react";
import { CandidatoAvatar } from "./CandidatoAvatar";
import { GravedadBadge } from "./GravedadBadge";
import { NoticiaItem } from "./NoticiaItem";
import { GRAVEDAD, type GravedadKey } from "@/lib/candidatos";

const ORDEN_GRAVEDAD: GravedadKey[] = ["MUY_PELIGROSO", "PELIGROSO", "MODERADO", "LEVE", "LIMPIO"];

interface NoticiaView {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  fuente: string;
  gravedad: string;
  tipo: string;
  fechaNoticia: string | null;
}

interface CandidatoDetalleClientProps {
  slug: string;
  nombre: string;
  partido: string;
  peorGravedad: GravedadKey;
  gravedadCounts: Record<string, number>;
  noticias: NoticiaView[];
  initialGravedad?: GravedadKey | null;
}

export function CandidatoDetalleClient({
  slug,
  nombre,
  partido,
  peorGravedad,
  gravedadCounts,
  noticias,
  initialGravedad = null,
}: CandidatoDetalleClientProps) {
  const [gravedadSeleccionada, setGravedadSeleccionada] = useState<GravedadKey | null>(initialGravedad);
  const [busqueda, setBusqueda] = useState("");

  const noticiasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return noticias.filter((n) => {
      if (gravedadSeleccionada && n.gravedad !== gravedadSeleccionada) return false;
      if (!q) return true;
      return (
        n.titulo.toLowerCase().includes(q)
        || n.descripcion.toLowerCase().includes(q)
        || n.fuente.toLowerCase().includes(q)
      );
    });
  }, [noticias, gravedadSeleccionada, busqueda]);

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
            <a href="/" className="hover:text-white transition-colors">Inicio</a>
            <span className="text-gray-700">/</span>
            <a href="/candidato" className="hover:text-white transition-colors">Candidatos</a>
            <span className="text-gray-700">/</span>
            <span className="text-gray-300 font-medium truncate max-w-[200px] sm:max-w-none">{nombre}</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
            <CandidatoAvatar
              slug={slug}
              nombre={nombre}
              size={80}
              className="rounded-xl border-3 shrink-0 sm:!w-[112px] sm:!h-[112px]"
              style={{
                borderColor: GRAVEDAD[peorGravedad].color,
                boxShadow: `0 0 20px ${GRAVEDAD[peorGravedad].color}25`,
              }}
            />
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-3xl font-black text-white">{nombre}</h1>
              <p className="mt-0.5 text-sm sm:text-lg text-gray-400">{partido}</p>
              <div className="mt-2 flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <GravedadBadge gravedad={peorGravedad} />
                <span className="text-xs sm:text-sm text-gray-500">
                  {noticiasFiltradas.length} noticia{noticiasFiltradas.length !== 1 ? "s" : ""}
                  {gravedadSeleccionada ? ` (${GRAVEDAD[gravedadSeleccionada].label})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Search local */}
          <div className="mb-5">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en noticias..."
              className="w-full rounded-xl bg-gray-900/60 border border-gray-800/60 text-white text-sm px-4 py-2.5 placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>

          {/* Gravedad breakdown */}
          {Object.keys(gravedadCounts).length > 0 && (
            <div className="mb-8 grid grid-cols-5 gap-1.5 sm:gap-2.5">
              {ORDEN_GRAVEDAD.map((g) => {
                const active = gravedadSeleccionada === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGravedadSeleccionada(active ? null : g)}
                    className={`group rounded-lg sm:rounded-xl border bg-gray-900/50 p-2 sm:p-3.5 text-center transition-all duration-200 ${
                      active
                        ? "border-white/30 ring-1 ring-white/20 bg-gray-900"
                        : "border-gray-800/60 hover:border-gray-600 hover:bg-gray-900"
                    }`}
                    title={`Filtrar por ${GRAVEDAD[g].label}`}
                  >
                    <p className="text-lg sm:text-2xl font-black transition-transform duration-200 group-hover:scale-110" style={{ color: GRAVEDAD[g].color }}>
                      {gravedadCounts[g] || 0}
                    </p>
                    <p className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">{GRAVEDAD[g].label}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Noticias */}
          <h2 className="text-base font-black uppercase tracking-[0.15em] text-gray-400 mb-5 border-b border-gray-800/60 pb-3">
            Noticias y Registros
          </h2>

          {noticiasFiltradas.length > 0 ? (
            <div className="space-y-3">
              {noticiasFiltradas.map((n) => (
                <NoticiaItem
                  key={n.id}
                  titulo={n.titulo}
                  descripcion={n.descripcion}
                  url={n.url}
                  fuente={n.fuente}
                  gravedad={n.gravedad}
                  tipo={n.tipo}
                  fechaNoticia={n.fechaNoticia}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-700/60 p-10 text-center">
              <p className="text-gray-500 text-sm">
                {gravedadSeleccionada
                  ? `No hay noticias para la gravedad ${GRAVEDAD[gravedadSeleccionada].label}${busqueda ? " con ese término de búsqueda" : ""}.`
                  : busqueda
                    ? "No hay noticias que coincidan con esa búsqueda."
                    : "No se han encontrado noticias relevantes."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
