/**
 * Backfill acotado de noticias municipales. Procesa una sola alcaldía para que
 * la ejecución sea auditable y no exceda el tiempo máximo del proveedor.
 *
 *   npm run backfill:noticias-municipales -- lima-metropolitana
 *   npm run backfill:noticias-municipales -- miraflores
 *   npm run backfill:noticias-municipales -- --all
 *   npm run backfill:noticias-municipales -- --all --start=miraflores
 *   npm run backfill:noticias-municipales -- miraflores --desde=2016-07-31
 *   npm run backfill:noticias-municipales -- --list
 */
import { ejecutarScraping } from "../src/lib/scraper";
import {
  AMBITO_PROVINCIAL,
  DISTRITOS_LIMA,
  POSTULANTES_POR_AMBITO,
} from "../src/lib/municipales";

const AMBITOS = [
  { slug: AMBITO_PROVINCIAL, nombre: "Lima Metropolitana" },
  ...DISTRITOS_LIMA.filter(
    (distrito) => !distrito.sinAlcaldiaPropia && POSTULANTES_POR_AMBITO.has(distrito.slug)
  ),
];

function argumento(nombre: string): string | undefined {
  return process.argv.find((item) => item.startsWith(`--${nombre}=`))?.split("=").slice(1).join("=");
}

function fechaValida(valor: string, nombre: string): Date {
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) throw new Error(`Fecha --${nombre} inválida: ${valor}`);
  return fecha;
}

function rangoPorDefecto() {
  const hoy = new Date();
  const desde = new Date(Date.UTC(hoy.getUTCFullYear() - 10, hoy.getUTCMonth(), hoy.getUTCDate()));
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 1));
  return { desde, hasta };
}

async function main() {
  if (process.argv.includes("--list")) {
    for (const ambito of AMBITOS) {
      console.log(`${ambito.slug}\t${ambito.nombre}\t${POSTULANTES_POR_AMBITO.get(ambito.slug) ?? 0}`);
    }
    return;
  }

  const base = rangoPorDefecto();
  const desde = argumento("desde") ? fechaValida(argumento("desde")!, "desde") : base.desde;
  const hasta = argumento("hasta") ? fechaValida(argumento("hasta")!, "hasta") : base.hasta;
  const todos = process.argv.includes("--all");
  const ambito = process.argv.slice(2).find((item) => !item.startsWith("--"));
  const seleccionado = ambito ? AMBITOS.find((item) => item.slug === ambito) : undefined;
  if (!todos && !seleccionado) {
    console.error("Indica una alcaldía válida. Usa --list para ver los ámbitos disponibles.");
    process.exit(1);
  }

  let pendientes = todos ? [...AMBITOS] : [seleccionado!];
  const start = argumento("start");
  if (start) {
    const indice = pendientes.findIndex((item) => item.slug === start);
    if (indice < 0) throw new Error(`Ámbito --start no encontrado: ${start}`);
    pendientes = pendientes.slice(indice);
  }

  console.log(
    `Backfill histórico municipal: ${desde.toISOString().slice(0, 10)} → ` +
    `${hasta.toISOString().slice(0, 10)} · ${pendientes.length} alcaldías`
  );

  for (let i = 0; i < pendientes.length; i++) {
    const item = pendientes[i];
    const total = POSTULANTES_POR_AMBITO.get(item.slug) ?? 0;
    console.log(`\n[${i + 1}/${pendientes.length}] ${item.nombre} · ${total} candidatos`);
    const resultado = await ejecutarScraping({
      eleccion: "municipal-2026",
      ambito: item.slug,
      desde,
      hasta,
    });
    console.log(JSON.stringify(resultado, null, 2));
    if (resultado.errores.length > 0) {
      throw new Error(`Backfill parcial en ${item.slug}; reanuda con --start=${item.slug}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
