"use client";

import { GravedadBadge } from "./GravedadBadge";

interface NoticiaItemProps {
  titulo: string;
  descripcion: string;
  url: string;
  fuente: string;
  gravedad: string;
  tipo: string;
  candidatoNombre?: string;
  candidatoPartido?: string;
  fechaNoticia: string | null;
}

const TIPO_LABELS: Record<string, string> = {
  SENTENCIA: "Sentencia",
  ACUSACION: "Acusación",
  DENUNCIA: "Denuncia",
  INVESTIGACION: "Investigación",
  LIMPIO: "Sin hallazgos",
};

function formatFecha(fecha: string | null): string {
  if (!fecha) return "Fecha no disponible";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "Fecha no disponible";

  // Formato determinista para evitar diferencias SSR/cliente por locale/timezone.
  const MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const day = d.getUTCDate();
  const month = MESES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} de ${month} de ${year}`;
}

export function NoticiaItem({
  titulo, descripcion, url, fuente, gravedad, tipo,
  candidatoNombre, candidatoPartido, fechaNoticia,
}: NoticiaItemProps) {
  return (
    <article className="group rounded-xl border border-gray-800/50 bg-gray-900/40 p-4 hover:border-gray-700 hover:bg-gray-900/70 transition-all duration-200">
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <GravedadBadge gravedad={gravedad} />
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-800/80 rounded-md px-2 py-0.5">
          {TIPO_LABELS[tipo] || tipo}
        </span>
        <span className="text-[10px] text-gray-700">·</span>
        <span className="text-[10px] text-gray-500 font-medium">{fuente}</span>
        <span className="text-[10px] text-gray-600">{formatFecha(fechaNoticia)}</span>
      </div>

      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
          {titulo}
        </h3>
      </a>

      {descripcion && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{descripcion}</p>
      )}

      {candidatoNombre && (
        <p className="mt-2 text-[10px] text-gray-500">
          <span className="font-semibold text-gray-400">{candidatoNombre}</span>
          {candidatoPartido && ` — ${candidatoPartido}`}
        </p>
      )}

      <a
        href={url} target="_blank" rel="noopener noreferrer"
        className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:text-red-400 transition-colors"
      >
        Ver fuente original
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
    </article>
  );
}
