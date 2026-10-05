import { NextResponse } from "next/server";
import { buildConteoOficialView, CONTEO_ID, type ConteoSnapshot } from "@/lib/conteo-oficial";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Latest official ONPE count for Lima Metropolitana and its districts.
 *
 * ONPE's WAF blocks Vercel's IPs, so `npm run sync:onpe` (run every minute from
 * a machine ONPE accepts) writes the count to the ConteoOnpe table and this
 * route serves it. The CDN caches it for 30 s, so the database sees at most
 * two reads a minute however many visitors poll.
 */
export async function GET() {
  try {
    const row = await prisma.conteoOnpe.findUnique({ where: { id: CONTEO_ID } });
    const snapshot = row?.data as ConteoSnapshot | undefined;
    const conteo = snapshot ? buildConteoOficialView(snapshot.ambitos, snapshot.actualizado) : null;
    return NextResponse.json(
      { conteo },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("[onpe/conteo]", error);
    return NextResponse.json(
      { conteo: null },
      { status: 503, headers: { "Cache-Control": "public, s-maxage=10" } }
    );
  }
}
