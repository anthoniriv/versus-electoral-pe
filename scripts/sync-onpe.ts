/**
 * Downloads ONPE's official count for Lima Metropolitana and its 42 districts
 * and writes src/lib/conteo-oficial-data.json, the static fallback the home
 * page renders before the live /api/onpe/conteo route answers.
 *
 *   npm run sync:onpe
 *
 * An ámbito is written only once it has valid votes, so the home page stays
 * in its normal mode until counting starts.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ConteoAmbitoInput } from "../src/lib/conteo-oficial";
import { AMBITO_PROVINCIAL } from "../src/lib/municipales";
import { fetchOnpeAmbito, horaLima, ONPE_AMBITOS } from "../src/lib/onpe";

const OUT = join(__dirname, "../src/lib/conteo-oficial-data.json");

async function main() {
  const ambitos: Record<string, ConteoAmbitoInput> = {};
  const fechas: string[] = [];
  for (let i = 0; i < ONPE_AMBITOS.length; i += 6) {
    const lote = ONPE_AMBITOS.slice(i, i + 6);
    const resultados = await Promise.all(lote.map(fetchOnpeAmbito));
    resultados.forEach((r, j) => {
      if (!r) return;
      ambitos[lote[j]] = r.input;
      fechas.push(r.fecha);
    });
  }

  const ultima = fechas.sort().at(-1);
  const actualizado = ultima ? horaLima(ultima) : null;

  writeFileSync(OUT, `${JSON.stringify({ actualizado, ambitos }, null, 2)}\n`);
  const lima = ambitos[AMBITO_PROVINCIAL];
  console.log(
    `ONPE ${actualizado ?? "(sin votos aún)"}: ${Object.keys(ambitos).length}/43 ámbitos con votos` +
      (lima ? ` · Lima ${lima.actasPct}% actas` : "")
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
