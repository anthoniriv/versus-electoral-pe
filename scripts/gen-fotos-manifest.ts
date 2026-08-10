/**
 * Genera el manifiesto de fotos disponibles en public/candidatos.
 *
 *   npm run gen:fotos-manifest
 *
 * CandidatoAvatar lo consulta para saber si un slug tiene foto (y con qué
 * extensión) antes de renderizar el <img>. Sin esto el componente sondeaba
 * jpg -> png -> webp -> svg y cada candidato sin foto generaba 4 respuestas 404
 * que la CDN no cachea: ~1800 edge requests por vista del padrón municipal.
 *
 * Se corre en el prebuild, así que el archivo generado siempre refleja lo que
 * hay en disco al momento del deploy.
 */
import { readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const FOTOS_DIR = resolve("public/candidatos");
const OUTPUT_PATH = resolve("src/lib/fotos-candidatos.ts");
const EXTENSIONES = ["jpg", "png", "webp", "svg"] as const;

type Extension = (typeof EXTENSIONES)[number];

function esExtensionSoportada(valor: string): valor is Extension {
  return (EXTENSIONES as readonly string[]).includes(valor);
}

async function main() {
  let archivos: string[] = [];
  try {
    archivos = await readdir(FOTOS_DIR);
  } catch {
    console.warn(`[fotos] ${FOTOS_DIR} no existe, se genera un manifiesto vacío`);
  }

  const fotos = new Map<string, Extension>();

  for (const archivo of archivos.sort()) {
    const punto = archivo.lastIndexOf(".");
    if (punto <= 0) continue;

    const slug = archivo.slice(0, punto);
    const extension = archivo.slice(punto + 1).toLowerCase();
    if (!esExtensionSoportada(extension)) continue;

    // El orden de EXTENSIONES define la preferencia cuando un slug tiene
    // varias variantes en disco.
    const actual = fotos.get(slug);
    if (actual && EXTENSIONES.indexOf(actual) <= EXTENSIONES.indexOf(extension)) continue;
    fotos.set(slug, extension);
  }

  const entradas = [...fotos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, extension]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(extension)},`)
    .join("\n");

  const contenido = `// Archivo generado por scripts/gen-fotos-manifest.ts. No editar a mano.
// Regenerar con: npm run gen:fotos-manifest

export const FOTOS_CANDIDATOS: Record<string, string> = {
${entradas}
};

export function fotoDeCandidato(slug: string): string | null {
  const extension = FOTOS_CANDIDATOS[slug];
  return extension ? \`/candidatos/\${slug}.\${extension}\` : null;
}
`;

  await writeFile(OUTPUT_PATH, contenido, "utf8");
  console.log(`[fotos] ${fotos.size} fotos indexadas en ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
