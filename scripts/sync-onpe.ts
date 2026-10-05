/**
 * Downloads ONPE's official count for Lima Metropolitana and its 42 districts,
 * stores it in the ConteoOnpe table (served live by /api/onpe/conteo) and writes
 * src/lib/conteo-oficial-data.json, the snapshot the home page renders first.
 *
 *   npm run sync:onpe
 *
 * ONPE's WAF blocks cloud IPs, so this runs every minute from a local machine.
 * An ámbito is written only once it has valid votes, so the home page stays
 * in its normal mode until counting starts.
 */
import { writeFileSync } from "node:fs";
import type { Prisma } from "@prisma/client";
import { join } from "node:path";
import { CONTEO_ID, type ConteoAmbitoInput, type ConteoSnapshot } from "../src/lib/conteo-oficial";
import { prisma } from "../src/lib/db";
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

  const snapshot: ConteoSnapshot = { actualizado, ambitos };
  writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  const data = snapshot as unknown as Prisma.InputJsonObject;
  await prisma.conteoOnpe.upsert({
    where: { id: CONTEO_ID },
    create: { id: CONTEO_ID, data },
    update: { data },
  });
  const lima = ambitos[AMBITO_PROVINCIAL];
  console.log(
    `ONPE ${actualizado ?? "(sin votos aún)"}: ${Object.keys(ambitos).length}/43 ámbitos con votos` +
      (lima ? ` · Lima ${lima.actasPct}% actas` : "")
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
