"use client";

import { useState } from "react";
import Link from "next/link";
import { GRAVEDAD, type GravedadKey } from "@/lib/candidatos";
import { GravedadBadge } from "./GravedadBadge";
import { CandidatoAvatar } from "./CandidatoAvatar";
import { normalize } from "@/lib/normalize";

interface CandidatoItem {
  id: number;
  nombre: string;
  partido: string;
  slug: string;
  totalNoticias: number;
  peorGravedad: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function CandidatosList({ candidatos }: { candidatos: CandidatoItem[] }) {
  const [search, setSearch] = useState("");
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  // Letters that have at least one candidate
  const availableLetters = new Set(
    candidatos.map((c) => normalize(c.nombre)[0]?.toUpperCase())
  );

  const filtered = candidatos.filter((c) => {
    const norm = normalize(c.nombre);
    const normPartido = normalize(c.partido);

    if (letterFilter && !norm.startsWith(letterFilter.toLowerCase())) return false;

    if (search) {
      const q = normalize(search);
      return norm.includes(q) || normPartido.includes(q);
    }

    return true;
  });

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setLetterFilter(null); }}
            placeholder="Buscar candidato o partido..."
            className="w-full rounded-xl bg-gray-900/60 border border-gray-800/60 text-white text-sm pl-10 pr-4 py-3 placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Letter filter */}
      <div className="mb-6 flex flex-wrap gap-1">
        <button
          onClick={() => setLetterFilter(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            !letterFilter
              ? "bg-red-600 text-white"
              : "bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Todos
        </button>
        {LETTERS.map((l) => {
          const available = availableLetters.has(l);
          const active = letterFilter === l;
          return (
            <button
              key={l}
              onClick={() => { setLetterFilter(active ? null : l); setSearch(""); }}
              disabled={!available}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                active
                  ? "bg-red-600 text-white"
                  : available
                    ? "bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800"
                    : "bg-gray-900/30 text-gray-700 cursor-not-allowed"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-4">
        {filtered.length === candidatos.length
          ? `${candidatos.length} candidatos`
          : `${filtered.length} de ${candidatos.length} candidatos`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`/candidato/${c.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-gray-800/60 bg-gray-900/50 p-4 hover:border-gray-600 hover:bg-gray-900 transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <CandidatoAvatar
                slug={c.slug}
                nombre={c.nombre}
                size={56}
                className="rounded-xl border-2 shrink-0 group-hover:scale-105 transition-transform duration-200"
                style={{ borderColor: GRAVEDAD[c.peorGravedad as GravedadKey]?.color || "#555" }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-sm truncate group-hover:text-red-400 transition-colors">{c.nombre}</p>
                <p className="text-xs text-gray-500 truncate">{c.partido}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <GravedadBadge gravedad={c.peorGravedad} />
                  <span className="text-xs text-gray-600">{c.totalNoticias} noticias</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-700/60 p-10 text-center">
          <p className="text-gray-500 text-sm">No se encontraron candidatos.</p>
        </div>
      )}
    </>
  );
}
