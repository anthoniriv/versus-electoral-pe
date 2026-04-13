export interface FlashCandidato {
  slug: string;
  nombre: string;
  partido: string;
  porcentaje: number;
  color: string;
}

export interface FlashEncuesta {
  id: string;
  encuestadora: string;
  medio: string;
  logoLabel: string;
  fecha: string;
  accent: string;
  candidatos: FlashCandidato[];
}

export const FLASH_ELECTORAL: FlashEncuesta[] = [
  {
    id: "datum",
    encuestadora: "Datum Internacional",
    medio: "El Comercio",
    logoLabel: "Datum",
    fecha: "12 abr 2026 · 18:00",
    accent: "#E11D48",
    candidatos: [
      { slug: "keiko-fujimori", nombre: "Keiko Fujimori", partido: "Fuerza Popular", porcentaje: 16.5, color: "#F59E0B" },
      { slug: "rafael-lopez-aliaga", nombre: "Rafael López Aliaga", partido: "Renovación Popular", porcentaje: 12.8, color: "#3B82F6" },
      { slug: "jorge-nieto-montesinos", nombre: "Jorge Nieto", partido: "Partido del Buen Gobierno", porcentaje: 11.6, color: "#10B981" },
      { slug: "ricardo-belmont", nombre: "Ricardo Belmont", partido: "Partido Cívico Obras", porcentaje: 10.5, color: "#F97316" },
      { slug: "roberto-sanchez-palomino", nombre: "Roberto Sánchez", partido: "Juntos por el Perú", porcentaje: 10.0, color: "#8B5CF6" },
    ],
  },
  {
    id: "ipsos",
    encuestadora: "Ipsos Perú",
    medio: "América TV / Canal N",
    logoLabel: "Ipsos",
    fecha: "12 abr 2026 · 18:00",
    accent: "#2563EB",
    candidatos: [
      { slug: "keiko-fujimori", nombre: "Keiko Fujimori", partido: "Fuerza Popular", porcentaje: 16.6, color: "#F59E0B" },
      { slug: "roberto-sanchez-palomino", nombre: "Roberto Sánchez", partido: "Juntos por el Perú", porcentaje: 12.1, color: "#8B5CF6" },
      { slug: "ricardo-belmont", nombre: "Ricardo Belmont", partido: "Partido Cívico Obras", porcentaje: 11.8, color: "#F97316" },
      { slug: "rafael-lopez-aliaga", nombre: "Rafael López Aliaga", partido: "Renovación Popular", porcentaje: 11.0, color: "#3B82F6" },
      { slug: "jorge-nieto-montesinos", nombre: "Jorge Nieto", partido: "Partido del Buen Gobierno", porcentaje: 10.7, color: "#10B981" },
    ],
  },
  {
    id: "cit-panamericana",
    encuestadora: "CIT",
    medio: "Panamericana TV",
    logoLabel: "CIT",
    fecha: "12 abr 2026 · 18:00",
    accent: "#DC2626",
    candidatos: [
      { slug: "keiko-fujimori", nombre: "Keiko Fujimori", partido: "Fuerza Popular", porcentaje: 19.8, color: "#F59E0B" },
      { slug: "rafael-lopez-aliaga", nombre: "Rafael López Aliaga", partido: "Renovación Popular", porcentaje: 13.0, color: "#3B82F6" },
      { slug: "ricardo-belmont", nombre: "Ricardo Belmont", partido: "Partido Cívico Obras", porcentaje: 12.9, color: "#F97316" },
    ],
  },
];

export interface OnpeCandidato {
  nombre: string;
  partido: string;
  slug: string | null;
  votos: number;
  porcentajeValidos: number;
  porcentajeEmitidos: number;
}

export interface OnpeResultado {
  success: boolean;
  actualizado: string;
  totalValidos: number;
  totalEmitidos: number;
  blancos: number;
  nulos: number;
  candidatos: OnpeCandidato[];
}
