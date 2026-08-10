"use client";

import { useState } from "react";
import {
  AMBITO_PROVINCIAL,
  DISTRITOS_LIMA,
  POSTULANTES_POR_AMBITO,
} from "@/lib/municipales";
import { VersusSelector } from "./VersusSelector";

const AMBITOS = [
  {
    slug: AMBITO_PROVINCIAL,
    nombre: "Lima Metropolitana",
    total: POSTULANTES_POR_AMBITO.get(AMBITO_PROVINCIAL) ?? 0,
  },
  ...DISTRITOS_LIMA.filter(
    (distrito) => !distrito.sinAlcaldiaPropia && POSTULANTES_POR_AMBITO.has(distrito.slug)
  ).map((distrito) => ({
    slug: distrito.slug,
    nombre: distrito.nombre,
    total: POSTULANTES_POR_AMBITO.get(distrito.slug) ?? 0,
  })),
];

export function VersusMunicipal() {
  const [ambito, setAmbito] = useState(AMBITO_PROVINCIAL);

  return (
    <>
      <section className="border-b border-gray-800/70 bg-gray-950 px-4 py-5">
        <div className="mx-auto max-w-xl">
          <label
            htmlFor="ambito-versus"
            className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-red-400"
          >
            Alcaldía a comparar
          </label>
          <select
            id="ambito-versus"
            value={ambito}
            onChange={(event) => setAmbito(event.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-red-500"
          >
            {AMBITOS.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.nombre} · {item.total} candidatos
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Solo se comparan postulantes que compiten por la misma municipalidad.
          </p>
        </div>
      </section>
      <VersusSelector key={ambito} eleccion="municipal-2026" ambito={ambito} />
    </>
  );
}
