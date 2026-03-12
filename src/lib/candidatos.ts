export interface CandidatoData {
  nombre: string;
  partido: string;
  slug: string;
  keywords: string[]; // Términos de búsqueda para el scraping — candidato, partido, variantes
  twitter?: string; // Handle de Twitter/X sin @
}

// Cada candidato incluye: nombre completo, apellidos, apodos, nombre del partido, variantes sin tilde
export const CANDIDATOS: CandidatoData[] = [
  {
    nombre: "Alfonso López Chau Nava", partido: "Ahora Nación", slug: "alfonso-lopez-chau-nava",
    keywords: ["López Chau", "Lopez Chau", "Ahora Nación", "Ahora Nacion", "López Chau Nava"],
  },
  {
    nombre: "Ronald Darwin Atencio Sotomayor", partido: "Alianza Electoral Venceremos", slug: "ronald-atencio-sotomayor",
    keywords: ["Atencio Sotomayor", "Ronald Atencio", "Alianza Electoral Venceremos"],
  },
  {
    nombre: "César Acuña Peralta", partido: "Alianza para el Progreso", slug: "cesar-acuna-peralta",
    keywords: ["César Acuña", "Cesar Acuña", "Cesar Acuna", "Acuña Peralta", "Alianza para el Progreso", "APP Acuña"],
  },
  {
    nombre: "José Williams Zapata", partido: "Avanza País – Partido de Integración Social", slug: "jose-williams-zapata",
    keywords: ["José Williams", "Jose Williams", "Williams Zapata", "Avanza País", "Avanza Pais"],
  },
  {
    nombre: "Keiko Fujimori Higuchi", partido: "Fuerza Popular", slug: "keiko-fujimori",
    keywords: ["Keiko Fujimori", "Fujimori Higuchi", "Keiko", "Fuerza Popular", "fujimorismo", "fujimorista"],
  },
  {
    nombre: "Fiorella Giannina Molinelli Aristondo", partido: "Fuerza y Libertad", slug: "fiorella-molinelli",
    keywords: ["Molinelli", "Fiorella Molinelli", "Molinelli Aristondo", "Fuerza y Libertad"],
  },
  {
    nombre: "Roberto Helbert Sánchez Palomino", partido: "Juntos por el Perú", slug: "roberto-sanchez-palomino",
    keywords: ["Sánchez Palomino", "Sanchez Palomino", "Roberto Sánchez Palomino", "Juntos por el Perú", "Juntos por el Peru"],
  },
  {
    nombre: "Rafael Jorge Belaunde Llosa", partido: "Libertad Popular", slug: "rafael-belaunde-llosa",
    keywords: ["Belaunde Llosa", "Rafael Belaunde", "Libertad Popular"],
  },
  {
    nombre: "Pitter Enrique Valderrama Peña", partido: "Partido Aprista Peruano", slug: "pitter-valderrama",
    keywords: ["Valderrama Peña", "Valderrama Pena", "Pitter Valderrama", "Partido Aprista", "APRA", "aprista"],
  },
  {
    nombre: "Ricardo Pablo Belmont Cassinelli", partido: "Partido Cívico Obras", slug: "ricardo-belmont",
    keywords: ["Ricardo Belmont", "Belmont Cassinelli", "Belmont", "Cívico Obras", "Civico Obras"],
  },
  {
    nombre: "Napoleón Becerra García", partido: "Partido de los Trabajadores y Emprendedores PTE", slug: "napoleon-becerra",
    keywords: ["Napoleón Becerra", "Napoleon Becerra", "Becerra García", "Becerra Garcia", "PTE Perú"],
  },
  {
    nombre: "Jorge Nieto Montesinos", partido: "Partido del Buen Gobierno", slug: "jorge-nieto-montesinos",
    keywords: ["Jorge Nieto", "Nieto Montesinos", "Buen Gobierno"],
  },
  {
    nombre: "Charlie Carrasco Salazar", partido: "Partido Demócrata Unido Perú", slug: "charlie-carrasco",
    keywords: ["Charlie Carrasco", "Carrasco Salazar", "Demócrata Unido", "Democrata Unido"],
  },
  {
    nombre: "Alex González Castillo", partido: "Partido Demócrata Verde", slug: "alex-gonzalez-castillo",
    keywords: ["Alex González Castillo", "Alex Gonzalez Castillo", "González Castillo", "Demócrata Verde", "Democrata Verde"],
  },
  {
    nombre: "Armando Joaquín Masse Fernández", partido: "Partido Democrático Federal", slug: "armando-masse",
    keywords: ["Armando Masse", "Masse Fernández", "Masse Fernandez", "Democrático Federal", "Democratico Federal"],
  },
  {
    nombre: "George Patrick Forsyth Sommer", partido: "Partido Democrático Somos Perú", slug: "george-forsyth",
    keywords: ["George Forsyth", "Forsyth Sommer", "Forsyth", "Somos Perú", "Somos Peru"],
  },
  {
    nombre: "Luis Fernando Olivera Vega", partido: "Partido Frente de la Esperanza 2021", slug: "luis-olivera-vega",
    keywords: ["Olivera Vega", "Luis Olivera", "Frente de la Esperanza"],
  },
  {
    nombre: "Mesías Antonio Guevara Amasifuen", partido: "Partido Morado", slug: "mesias-guevara",
    keywords: ["Mesías Guevara", "Mesias Guevara", "Guevara Amasifuen", "Partido Morado"],
  },
  {
    nombre: "Carlos Gonsalo Álvarez Loayza", partido: "Partido País para Todos", slug: "carlos-alvarez-loayza",
    keywords: ["Álvarez Loayza", "Alvarez Loayza", "Carlos Álvarez Loayza", "País para Todos", "Pais para Todos"],
  },
  {
    nombre: "Herbert Caller Gutiérrez", partido: "Partido Patriótico del Perú", slug: "herbert-caller",
    keywords: ["Herbert Caller", "Caller Gutiérrez", "Caller Gutierrez", "Patriótico del Perú", "Patriotico del Peru"],
  },
  {
    nombre: "Yonhy Lescano Ancieta", partido: "Partido Político Cooperación Popular", slug: "yonhy-lescano",
    keywords: ["Yonhy Lescano", "Lescano Ancieta", "Lescano", "Cooperación Popular", "Cooperacion Popular"],
  },
  {
    nombre: "Álvaro Gonzalo Paz de la Barra Freigeiro", partido: "Partido Político Fe en el Perú", slug: "alvaro-paz-de-la-barra",
    keywords: ["Paz de la Barra", "Álvaro Paz de la Barra", "Alvaro Paz de la Barra", "Fe en el Perú", "Fe en el Peru"],
  },
  {
    nombre: "Wolfgang Mario Grozo Costa", partido: "Partido Político Integridad Democrática", slug: "wolfgang-grozo",
    keywords: ["Wolfgang Grozo", "Grozo Costa", "Integridad Democrática", "Integridad Democratica"],
  },
  {
    nombre: "Vladimir Roy Cerrón Rojas", partido: "Partido Político Nacional Perú Libre", slug: "vladimir-cerron",
    keywords: ["Vladimir Cerrón", "Vladimir Cerron", "Cerrón Rojas", "Cerron Rojas", "Cerrón", "Cerron", "Perú Libre", "Peru Libre"],
  },
  {
    nombre: "Francisco Ernesto Diez-Canseco Távara", partido: "Partido Político Perú Acción", slug: "francisco-diez-canseco",
    keywords: ["Diez-Canseco", "Diez Canseco", "Francisco Diez Canseco", "Perú Acción", "Peru Accion"],
  },
  {
    nombre: "Mario Enrique Vizcarra Cornejo", partido: "Partido Político Perú Primero", slug: "mario-vizcarra-cornejo",
    keywords: ["Vizcarra Cornejo", "Mario Vizcarra Cornejo", "Perú Primero", "Peru Primero"],
  },
  {
    nombre: "Walter Gilmer Chirinos Purizaga", partido: "Partido Político PRIN", slug: "walter-chirinos",
    keywords: ["Walter Chirinos", "Chirinos Purizaga", "Partido PRIN", "PRIN"],
  },
  {
    nombre: "Carlos Espá Y Garcés-Alvear", partido: "Partido SíCreo", slug: "carlos-espa",
    keywords: ["Carlos Espá", "Carlos Espa", "Espá Garcés", "Espa Garces", "SíCreo", "SiCreo"],
  },
  {
    nombre: "Carlos Ernesto Jaico Carranza", partido: "Perú Moderno", slug: "carlos-jaico",
    keywords: ["Carlos Jaico", "Jaico Carranza", "Perú Moderno", "Peru Moderno"],
  },
  {
    nombre: "José Luna Gálvez", partido: "Podemos Perú", slug: "jose-luna-galvez",
    keywords: ["José Luna Gálvez", "Jose Luna Galvez", "Luna Gálvez", "Luna Galvez", "José Luna", "Podemos Perú", "Podemos Peru"],
  },
  {
    nombre: "Marisol Pérez Tello", partido: "Primero la Gente", slug: "marisol-perez-tello",
    keywords: ["Marisol Pérez Tello", "Marisol Perez Tello", "Pérez Tello", "Perez Tello", "Primero la Gente"],
  },
  {
    nombre: "Paul Davis Jaimes Blanco", partido: "Progresemos", slug: "paul-jaimes-blanco",
    keywords: ["Paul Jaimes", "Jaimes Blanco", "Progresemos"],
  },
  {
    nombre: "Rafael López Aliaga", partido: "Renovación Popular", slug: "rafael-lopez-aliaga",
    keywords: ["López Aliaga", "Lopez Aliaga", "Rafael López Aliaga", "Renovación Popular", "Renovacion Popular", "Porky"],
    twitter: "rlopezaliaga1",
  },
  {
    nombre: "Antonio Ortiz Villano", partido: "Salvemos al Perú", slug: "antonio-ortiz-villano",
    keywords: ["Antonio Ortiz Villano", "Ortiz Villano", "Salvemos al Perú", "Salvemos al Peru"],
  },
  {
    nombre: "Rosario del Pilar Fernández Bazán", partido: "Un Camino Diferente", slug: "rosario-fernandez-bazan",
    keywords: ["Rosario Fernández", "Rosario Fernandez", "Fernández Bazán", "Fernandez Bazan", "Un Camino Diferente"],
  },
  {
    nombre: "Roberto Enrique Chiabra León", partido: "Unidad Nacional", slug: "roberto-chiabra",
    keywords: ["Roberto Chiabra", "Chiabra León", "Chiabra Leon", "Chiabra", "Unidad Nacional"],
  },
];

export const GRAVEDAD = {
  MUY_PELIGROSO: { label: "Muy Peligroso", color: "#dc2626", description: "Sentencias firmes, condenas judiciales" },
  PELIGROSO: { label: "Peligroso", color: "#ea580c", description: "Acusaciones fiscales formales, procesos penales abiertos" },
  MODERADO: { label: "Moderado", color: "#ca8a04", description: "Denuncias en investigación, procesos administrativos" },
  LEVE: { label: "Leve", color: "#2563eb", description: "Denuncias sin fundamento demostrado, controversias menores" },
  LIMPIO: { label: "Limpio", color: "#16a34a", description: "Sin denuncias ni acusaciones conocidas" },
} as const;

export type GravedadKey = keyof typeof GRAVEDAD;
