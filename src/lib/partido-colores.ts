import { normalize } from "./normalize";

/**
 * Brand colour of each party, approximated from its official logo and tuned to
 * read on the dark results card. Matched by keyword so both the JNE spelling
 * ("Renovación Popular") and ONPE's ("RENOVACIÓN POPULAR PERÚ") resolve.
 * Parties whose colour is not verified fall back to a neutral grey on purpose:
 * a wrong colour is worse than none on an electoral results page.
 */
const COLORES: Array<[keyword: string, color: string]> = [
  ["renovacion popular", "#38bdf8"],
  ["somos peru", "#ef4444"],
  ["alianza para el progreso", "#3b82f6"],
  ["accion popular", "#f43f5e"],
  ["fuerza popular", "#f97316"],
  ["partido morado", "#a855f7"],
  ["popular cristiano", "#22c55e"],
  ["democrata verde", "#4ade80"],
  ["aprista", "#dc2626"],
  ["peru libre", "#e11d48"],
];

export const COLOR_NEUTRO = "#9ca3af";

export function colorPartido(partido: string | null | undefined): string {
  if (!partido) return COLOR_NEUTRO;
  const nombre = normalize(partido);
  return COLORES.find(([keyword]) => nombre.includes(keyword))?.[1] ?? COLOR_NEUTRO;
}
