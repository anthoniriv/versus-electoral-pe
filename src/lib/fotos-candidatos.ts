// Archivo generado por scripts/gen-fotos-manifest.ts. No editar a mano.
// Regenerar con: npm run gen:fotos-manifest

export const FOTOS_CANDIDATOS: Record<string, string> = {
  "alex-gonzalez-castillo": "jpg",
  "alfonso-lopez-chau-nava": "jpg",
  "alvaro-paz-de-la-barra": "jpg",
  "antonio-ortiz-villano": "jpg",
  "armando-masse": "jpg",
  "carlos-alvarez-loayza": "jpg",
  "carlos-espa": "jpg",
  "carlos-jaico": "jpg",
  "cesar-acuna-peralta": "jpg",
  "charlie-carrasco": "jpg",
  "fiorella-molinelli": "jpg",
  "francisco-diez-canseco": "jpg",
  "george-forsyth": "jpg",
  "herbert-caller": "jpg",
  "jorge-nieto-montesinos": "jpg",
  "jose-luna-galvez": "jpg",
  "jose-williams-zapata": "jpg",
  "keiko-fujimori": "jpg",
  "luis-olivera-vega": "jpg",
  "mario-vizcarra-cornejo": "jpg",
  "marisol-perez-tello": "jpg",
  "mesias-guevara": "jpg",
  "napoleon-becerra": "jpg",
  "paul-jaimes-blanco": "jpg",
  "pitter-valderrama": "jpg",
  "rafael-belaunde-llosa": "jpg",
  "rafael-lopez-aliaga": "jpg",
  "ricardo-belmont": "jpg",
  "roberto-chiabra": "jpg",
  "roberto-sanchez-palomino": "jpg",
  "ronald-atencio-sotomayor": "jpg",
  "rosario-fernandez-bazan": "jpg",
  "vladimir-cerron": "jpg",
  "walter-chirinos": "jpg",
  "wolfgang-grozo": "jpg",
  "yonhy-lescano": "jpg",
};

export function fotoDeCandidato(slug: string): string | null {
  const extension = FOTOS_CANDIDATOS[slug];
  return extension ? `/candidatos/${slug}.${extension}` : null;
}
