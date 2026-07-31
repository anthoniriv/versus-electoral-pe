// Catálogo de elecciones que cubre el sitio. El switch global del header vive
// sobre esta lista: cada elección tiene su propio árbol de rutas, de modo que
// las URLs presidenciales ya indexadas no cambian y ambas siguen siendo ISR.

export type EleccionId = "presidencial-2026" | "municipal-2026";

export interface Eleccion {
  id: EleccionId;
  /** Texto corto del switch */
  label: string;
  /** Título largo para h1/metadata */
  labelLargo: string;
  /** Cómo llamamos a quien postula: "candidatos presidenciales" / "candidatos a alcalde" */
  cargo: string;
  cargoSingular: string;
  fecha: string;
  /** Raíz de las rutas de esta elección */
  basePath: string;
  listaPath: string;
  versusPath: string;
  /** false = todavía sin padrón cargado; la UI lo muestra como "próximamente" */
  conDatos: boolean;
}

export const ELECCIONES: Eleccion[] = [
  {
    id: "presidencial-2026",
    label: "Presidenciales",
    labelLargo: "Elecciones Presidenciales 2026",
    cargo: "candidatos presidenciales",
    cargoSingular: "candidato presidencial",
    fecha: "12 abr 2026",
    basePath: "/candidato",
    listaPath: "/candidato",
    versusPath: "/versus",
    conDatos: true,
  },
  {
    id: "municipal-2026",
    label: "Alcaldes",
    labelLargo: "Elecciones Municipales 2026 · Lima",
    cargo: "candidatos a alcalde",
    cargoSingular: "candidato a alcalde",
    fecha: "4 oct 2026",
    basePath: "/alcaldes",
    listaPath: "/alcaldes",
    versusPath: "/alcaldes/versus",
    conDatos: false,
  },
];

export const ELECCION_DEFAULT: EleccionId = "presidencial-2026";

export function getEleccion(id: EleccionId): Eleccion {
  return ELECCIONES.find((e) => e.id === id) ?? ELECCIONES[0];
}

/** Deduce la elección activa a partir del pathname (fuente de verdad del switch). */
export function eleccionFromPath(pathname: string): EleccionId {
  return pathname.startsWith("/alcaldes") ? "municipal-2026" : ELECCION_DEFAULT;
}
