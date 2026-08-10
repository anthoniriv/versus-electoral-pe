/**
 * Descarga las fotografías publicadas por el JNE para las candidaturas
 * municipales y las guarda con el slug que ya consume CandidatoAvatar.
 *
 *   npm run ingest:fotos-municipales
 *   npm run ingest:fotos-municipales -- --limit=10
 *   npm run ingest:fotos-municipales -- --force
 *
 * Si el JNE cambia la ruta del archivo, se puede definir:
 *   JNE_FOTO_URL_TEMPLATE="https://.../{id}.jpg"
 */
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CANDIDATOS_MUNICIPALES } from "../src/lib/municipales";

const OUTPUT_DIR = resolve("public/candidatos");
const REPORT_PATH = resolve("src/lib/fotos-municipales-data.json");
const CONCURRENCIA = 12;
const EXTENSIONES = ["jpg", "png", "webp", "svg"] as const;
const FORCE = process.argv.includes("--force");
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : CANDIDATOS_MUNICIPALES.length;

const PLANTILLAS = [
  process.env.JNE_FOTO_URL_TEMPLATE,
  // Ruta publicada por el propio controlador de Hoja de Vida del JNE.
  // Cuando el archivo aún no existe, Declara responde HTML y se descarta.
  "https://declara.jne.gob.pe/Assets/Fotos-HojaVida/{id}.jpg",
].filter((url): url is string => Boolean(url));

function tipoImagen(buffer: Uint8Array): "jpg" | "png" | "webp" | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (
    String.fromCharCode(...buffer.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...buffer.slice(8, 12)) === "WEBP"
  ) return "webp";
  return null;
}

async function existe(slug: string): Promise<string | null> {
  for (const extension of EXTENSIONES) {
    try {
      await access(resolve(OUTPUT_DIR, `${slug}.${extension}`));
      return extension;
    } catch { /* siguiente extensión */ }
  }
  return null;
}

async function descargar(id: number): Promise<{ buffer: Uint8Array; extension: string; url: string } | null> {
  for (const plantilla of PLANTILLAS) {
    const url = plantilla.replace("{id}", String(id));
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
          Referer: "https://plataformahistorico.jne.gob.pe/ListaDeCandidatos/",
          "User-Agent": "Mozilla/5.0 VersusElectoralPeru/1.0",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) continue;
      const buffer = new Uint8Array(await response.arrayBuffer());
      if (buffer.byteLength < 1_000) continue;
      const extension = tipoImagen(buffer);
      if (!extension) continue;
      return { buffer, extension, url };
    } catch { /* probar siguiente plantilla */ }
  }
  return null;
}

async function mapConcurrent<T, R>(items: T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, items.length) }, worker));
  return results;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const candidatos = CANDIDATOS_MUNICIPALES.slice(0, Number.isFinite(LIMIT) ? LIMIT : CANDIDATOS_MUNICIPALES.length);
  let procesados = 0;

  const resultados = await mapConcurrent(candidatos, async (candidato) => {
    const actual = await existe(candidato.slug);
    if (actual && !FORCE) {
      procesados++;
      return { slug: candidato.slug, estado: "existente", extension: actual };
    }
    if (!candidato.hojaVidaId) {
      procesados++;
      return { slug: candidato.slug, estado: "sin-hoja-vida" };
    }

    const foto = await descargar(candidato.hojaVidaId);
    procesados++;
    if (procesados % 25 === 0 || procesados === candidatos.length) {
      console.log(`JNE: ${procesados}/${candidatos.length} fotografías revisadas`);
    }
    if (!foto) return { slug: candidato.slug, estado: "sin-foto-oficial" };

    if (FORCE) {
      await Promise.all(EXTENSIONES.map((extension) =>
        unlink(resolve(OUTPUT_DIR, `${candidato.slug}.${extension}`)).catch(() => undefined)
      ));
    }
    await writeFile(resolve(OUTPUT_DIR, `${candidato.slug}.${foto.extension}`), foto.buffer);
    return { slug: candidato.slug, estado: "descargada", extension: foto.extension, fuente: foto.url };
  });

  const resumen = resultados.reduce<Record<string, number>>((acc, item) => {
    acc[item.estado] = (acc[item.estado] ?? 0) + 1;
    return acc;
  }, {});
  const reporte = {
    metadata: {
      fuente: "JNE · Plataforma Electoral / Sistema Declara",
      fechaConsulta: new Date().toISOString(),
      candidatosObjetivo: candidatos.length,
      plantillasConsultadas: PLANTILLAS,
      resumen,
    },
    resultados,
  };
  await writeFile(REPORT_PATH, `${JSON.stringify(reporte, null, 2)}\n`, "utf8");
  console.log(`✓ Reporte escrito en ${REPORT_PATH}`);
  console.log(JSON.stringify(resumen, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
