import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CANDIDATOS = [
  { nombre: "Alfonso López Chau Nava", partido: "Ahora Nación", slug: "alfonso-lopez-chau-nava" },
  { nombre: "Ronald Darwin Atencio Sotomayor", partido: "Alianza Electoral Venceremos", slug: "ronald-atencio-sotomayor" },
  { nombre: "César Acuña Peralta", partido: "Alianza para el Progreso", slug: "cesar-acuna-peralta" },
  { nombre: "José Williams Zapata", partido: "Avanza País – Partido de Integración Social", slug: "jose-williams-zapata" },
  { nombre: "Keiko Fujimori Higuchi", partido: "Fuerza Popular", slug: "keiko-fujimori" },
  { nombre: "Fiorella Giannina Molinelli Aristondo", partido: "Fuerza y Libertad", slug: "fiorella-molinelli" },
  { nombre: "Roberto Helbert Sánchez Palomino", partido: "Juntos por el Perú", slug: "roberto-sanchez-palomino" },
  { nombre: "Rafael Jorge Belaunde Llosa", partido: "Libertad Popular", slug: "rafael-belaunde-llosa" },
  { nombre: "Pitter Enrique Valderrama Peña", partido: "Partido Aprista Peruano", slug: "pitter-valderrama" },
  { nombre: "Ricardo Pablo Belmont Cassinelli", partido: "Partido Cívico Obras", slug: "ricardo-belmont" },
  { nombre: "Napoleón Becerra García", partido: "Partido de los Trabajadores y Emprendedores PTE", slug: "napoleon-becerra" },
  { nombre: "Jorge Nieto Montesinos", partido: "Partido del Buen Gobierno", slug: "jorge-nieto-montesinos" },
  { nombre: "Charlie Carrasco Salazar", partido: "Partido Demócrata Unido Perú", slug: "charlie-carrasco" },
  { nombre: "Alex González Castillo", partido: "Partido Demócrata Verde", slug: "alex-gonzalez-castillo" },
  { nombre: "Armando Joaquín Masse Fernández", partido: "Partido Democrático Federal", slug: "armando-masse" },
  { nombre: "George Patrick Forsyth Sommer", partido: "Partido Democrático Somos Perú", slug: "george-forsyth" },
  { nombre: "Luis Fernando Olivera Vega", partido: "Partido Frente de la Esperanza 2021", slug: "luis-olivera-vega" },
  { nombre: "Mesías Antonio Guevara Amasifuen", partido: "Partido Morado", slug: "mesias-guevara" },
  { nombre: "Carlos Gonsalo Álvarez Loayza", partido: "Partido País para Todos", slug: "carlos-alvarez-loayza" },
  { nombre: "Herbert Caller Gutiérrez", partido: "Partido Patriótico del Perú", slug: "herbert-caller" },
  { nombre: "Yonhy Lescano Ancieta", partido: "Partido Político Cooperación Popular", slug: "yonhy-lescano" },
  { nombre: "Álvaro Gonzalo Paz de la Barra Freigeiro", partido: "Partido Político Fe en el Perú", slug: "alvaro-paz-de-la-barra" },
  { nombre: "Wolfgang Mario Grozo Costa", partido: "Partido Político Integridad Democrática", slug: "wolfgang-grozo" },
  { nombre: "Vladimir Roy Cerrón Rojas", partido: "Partido Político Nacional Perú Libre", slug: "vladimir-cerron" },
  { nombre: "Francisco Ernesto Diez-Canseco Távara", partido: "Partido Político Perú Acción", slug: "francisco-diez-canseco" },
  { nombre: "Mario Enrique Vizcarra Cornejo", partido: "Partido Político Perú Primero", slug: "mario-vizcarra-cornejo" },
  { nombre: "Walter Gilmer Chirinos Purizaga", partido: "Partido Político PRIN", slug: "walter-chirinos" },
  { nombre: "Carlos Espá Y Garcés-Alvear", partido: "Partido SíCreo", slug: "carlos-espa" },
  { nombre: "Carlos Ernesto Jaico Carranza", partido: "Perú Moderno", slug: "carlos-jaico" },
  { nombre: "José Luna Gálvez", partido: "Podemos Perú", slug: "jose-luna-galvez" },
  { nombre: "Marisol Pérez Tello", partido: "Primero la Gente", slug: "marisol-perez-tello" },
  { nombre: "Paul Davis Jaimes Blanco", partido: "Progresemos", slug: "paul-jaimes-blanco" },
  { nombre: "Rafael López Aliaga", partido: "Renovación Popular", slug: "rafael-lopez-aliaga" },
  { nombre: "Antonio Ortiz Villano", partido: "Salvemos al Perú", slug: "antonio-ortiz-villano" },
  { nombre: "Rosario del Pilar Fernández Bazán", partido: "Un Camino Diferente", slug: "rosario-fernandez-bazan" },
  { nombre: "Roberto Enrique Chiabra León", partido: "Unidad Nacional", slug: "roberto-chiabra" },
];

async function main() {
  console.log("Seeding candidatos...");

  for (const c of CANDIDATOS) {
    await prisma.candidato.upsert({
      where: { slug: c.slug },
      update: { nombre: c.nombre, partido: c.partido },
      create: c,
    });
  }

  console.log(`✓ ${CANDIDATOS.length} candidatos creados/actualizados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
