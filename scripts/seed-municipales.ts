/**
 * Siembra/actualiza en BD el padrón municipal generado desde el JNE.
 * Idempotente (upsert por slug): se puede correr cada vez que se regenera
 * src/lib/municipales-data.ts con estados nuevos.
 *
 *   npx tsx scripts/seed-municipales.ts
 */
import { PrismaClient } from "@prisma/client";
import { CANDIDATOS_MUNICIPALES } from "../src/lib/municipales";

const prisma = new PrismaClient();

async function main() {
  let creados = 0;
  let actualizados = 0;

  for (const c of CANDIDATOS_MUNICIPALES) {
    const datos = {
      nombre: c.nombre,
      partido: c.partido,
      eleccion: "municipal-2026",
      ambito: c.ambito,
      estado: c.estado,
      hojaVidaId: c.hojaVidaId,
    };
    const previo = await prisma.candidato.findUnique({ where: { slug: c.slug } });
    await prisma.candidato.upsert({
      where: { slug: c.slug },
      update: datos,
      create: { ...datos, slug: c.slug },
    });
    if (previo) actualizados++;
    else creados++;
  }

  console.log(`✓ municipales: ${creados} creados, ${actualizados} actualizados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
