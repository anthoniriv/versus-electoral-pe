/**
 * Genera src/lib/municipales-data.ts desde el export del JNE (ERM 2026).
 *
 *   npx tsx scripts/generar-municipales.ts <ruta-al-json>
 *
 * El archivo generado NO se edita a mano: se vuelve a correr este script cuando
 * el JNE actualiza estados (RECIBIDO → ADMITIDO → INSCRITO, tachas, etc.).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface PostulanteJNE {
  nombre_completo: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  partido_o_alianza: string;
  estado_lista: string;
  estado_postulante: string;
  expediente: string;
  id_hoja_vida: number | null;
}

interface ExportJNE {
  metadata: { fecha_corte_iso: string; fuente: string };
  lima_metropolitana: { postulantes: PostulanteJNE[] };
  distritos: Array<{ distrito: string; postulantes: PostulanteJNE[] }>;
}

const AMBITO_PROVINCIAL = "lima-metropolitana";

/** Nombres del JNE que no coinciden con el slug del distrito. */
const SLUG_OVERRIDES: Record<string, string> = {
  lurigancho: "lurigancho-chosica",
};

function quitarTildes(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(s: string) {
  return quitarTildes(s)
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugDistrito(nombre: string) {
  const base = slugify(nombre);
  return SLUG_OVERRIDES[base] ?? base;
}

const MINUSCULAS = new Set(["de", "del", "la", "las", "los", "y", "e"]);

/** El JNE devuelve todo en mayúsculas; lo pasamos a capitalización normal. */
function titleCase(s: string) {
  return s
    .toLocaleLowerCase("es-PE")
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) =>
      i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toLocaleUpperCase("es-PE") + w.slice(1)
    )
    .join(" ");
}

/**
 * El JNE entrega los partidos en mayúsculas y sin tildes. Mapeamos a su forma
 * publicable; lo que no esté aquí sale con capitalización automática.
 * (Los nombres de los postulantes se dejan tal cual los registra el JNE.)
 */
const PARTIDOS: Record<string, string> = {
  "Accion Popular": "Acción Popular",
  "Ahora Nacion - An": "Ahora Nación",
  "Alianza Para El Progreso": "Alianza para el Progreso",
  "Alianza Regional Por El Peru": "Alianza Regional por el Perú",
  "Avanza Pais - Partido de Integracion Social": "Avanza País",
  "Batalla Peru": "Batalla Perú",
  "Coalicion Transformadora Tierra Verde": "Coalición Transformadora Tierra Verde",
  "Cooperacion, Verdad y Honradez": "Cooperación, Verdad y Honradez",
  "Fe En El Peru": "Fe en el Perú",
  "Frente Popular Agricola Fia del Peru": "Frente Popular Agrícola FIA del Perú",
  "Juntos Por El Peru": "Juntos por el Perú",
  "Partido Civico Obras": "Partido Cívico Obras",
  "Partido Democrata Unido Peru": "Partido Demócrata Unido Perú",
  "Partido Democrata Verde": "Partido Demócrata Verde",
  "Partido Democratico Somos Peru": "Partido Democrático Somos Perú",
  "Partido Pais Para Todos": "Partido País para Todos",
  "Partido Patriotico del Peru": "Partido Patriótico del Perú",
  "Partido Politico Adp": "Partido Político ADP",
  "Partido Politico Integridad Democratica": "Partido Político Integridad Democrática",
  "Partido Politico Nacional Peru Libre": "Perú Libre",
  "Partido Politico Peru Primero": "Perú Primero",
  "Partido Politico Prin": "Partido Político PRIN",
  "Partido Politico Pueblo Consciente": "Partido Político Pueblo Consciente",
  "Partido Popular Cristiano - Ppc": "Partido Popular Cristiano (PPC)",
  "Partido Sicreo": "Partido SíCreo",
  "Peru Moderno": "Perú Moderno",
  "Podemos Peru": "Podemos Perú",
  "Renovacion Popular Peru": "Renovación Popular",
  "Salvemos Al Peru": "Salvemos al Perú",
  "Vision Peru": "Visión Perú",
};

function partidoLabel(raw: string) {
  const base = titleCase(raw);
  return PARTIDOS[base] ?? base;
}

// Postulantes que ya no compiten: no los publicamos ni los scrapeamos.
const ESTADOS_DESCARTADOS = new Set([
  "IMPROCEDENTE",
  "INADMISIBLE",
  "RENUNCIA",
  "EXCLUSION",
]);

/**
 * Keywords de búsqueda. A diferencia de los presidenciales NO incluimos el
 * partido: con 500+ candidatos, "Acción Popular" atribuiría cualquier noticia
 * del partido a un candidato distrital al azar.
 */
function keywords(p: PostulanteJNE): string[] {
  const nombres = titleCase(p.nombres);
  const paterno = titleCase(p.apellido_paterno);
  const materno = titleCase(p.apellido_materno);
  const primerNombre = nombres.split(" ")[0];

  const variantes = new Set<string>();
  variantes.add(`${paterno} ${materno}`.trim());
  variantes.add(`${primerNombre} ${paterno}`.trim());
  variantes.add(`${nombres} ${paterno}`.trim());
  variantes.add(titleCase(p.nombre_completo));

  // Variantes sin tildes para medios que las omiten
  for (const v of [...variantes]) {
    const sinTildes = quitarTildes(v);
    if (sinTildes !== v) variantes.add(sinTildes);
  }

  return [...variantes].filter((v) => v.length > 5);
}

function main() {
  const ruta = process.argv[2];
  if (!ruta) {
    console.error("Uso: npx tsx scripts/generar-municipales.ts <ruta-al-json>");
    process.exit(1);
  }

  const data: ExportJNE = JSON.parse(readFileSync(ruta, "utf8"));

  const filas: string[] = [];
  const slugsUsados = new Map<string, number>();
  let descartados = 0;

  function agregar(p: PostulanteJNE, ambito: string) {
    if (ESTADOS_DESCARTADOS.has(p.estado_postulante)) {
      descartados++;
      return;
    }

    // Los slugs son únicos a nivel global (Candidato.slug es @unique): si dos
    // postulantes de distritos distintos comparten nombre, desempatamos con el ámbito.
    let slug = slugify(p.nombre_completo);
    const vistos = slugsUsados.get(slug) ?? 0;
    slugsUsados.set(slug, vistos + 1);
    if (vistos > 0) slug = `${slug}-${ambito}`;

    filas.push(
      `  { nombre: ${JSON.stringify(titleCase(p.nombre_completo))}, ` +
        `partido: ${JSON.stringify(partidoLabel(p.partido_o_alianza))}, ` +
        `slug: ${JSON.stringify(slug)}, ` +
        `ambito: ${JSON.stringify(ambito)}, ` +
        `estado: ${JSON.stringify(p.estado_postulante)}, ` +
        `expediente: ${JSON.stringify(p.expediente)}, ` +
        `hojaVidaId: ${p.id_hoja_vida ?? "null"}, ` +
        `keywords: ${JSON.stringify(keywords(p))} },`
    );
  }

  for (const p of data.lima_metropolitana.postulantes) agregar(p, AMBITO_PROVINCIAL);
  for (const d of data.distritos) {
    const ambito = slugDistrito(d.distrito);
    for (const p of d.postulantes) agregar(p, ambito);
  }

  const salida = `// ARCHIVO GENERADO — no editar a mano.
// Fuente: ${data.metadata.fuente}
// Corte JNE: ${data.metadata.fecha_corte_iso}
// Regenerar: npx tsx scripts/generar-municipales.ts <json-del-jne>
import type { CandidatoMunicipal } from "./municipales";

export const CORTE_JNE = ${JSON.stringify(data.metadata.fecha_corte_iso)};

export const CANDIDATOS_MUNICIPALES_DATA: CandidatoMunicipal[] = [
${filas.join("\n")}
];
`;

  const destino = resolve("src/lib/municipales-data.ts");
  writeFileSync(destino, salida);
  console.log(
    `✓ ${filas.length} postulantes escritos en ${destino} (${descartados} descartados por estado)`
  );
}

main();
