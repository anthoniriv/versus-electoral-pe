import { NextResponse } from "next/server";
import { buildConteoAmbitoView } from "@/lib/conteo-oficial";
import { AMBITO_PROVINCIAL, DISTRITO_BY_SLUG } from "@/lib/municipales";
import { fetchOnpeAmbito, horaLima, ONPE_AMBITOS } from "@/lib/onpe";

export const dynamic = "force-dynamic";
// ONPE's WAF challenges requests from US data centres; São Paulo is the closest region to Lima.
export const preferredRegion = "gru1";

/**
 * Live ONPE count for one ámbito (?ambito=lima-metropolitana or a district slug).
 *
 * The CDN caches each ámbito for 30 s, so ONPE gets at most two requests per
 * ámbito every 30 s no matter how many visitors poll. Function responses cached
 * this way cost no ISR writes. If ONPE fails, the home page keeps the static
 * count from conteo-oficial-data.json.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("ambito") ?? AMBITO_PROVINCIAL;
  if (!ONPE_AMBITOS.includes(slug)) {
    return NextResponse.json({ error: "Ámbito desconocido" }, { status: 400 });
  }
  const nombre = slug === AMBITO_PROVINCIAL ? "Lima Metropolitana" : (DISTRITO_BY_SLUG.get(slug)?.nombre ?? slug);

  try {
    const resultado = await fetchOnpeAmbito(slug);
    return NextResponse.json(
      {
        actualizado: resultado ? horaLima(resultado.fecha) : null,
        ambito: buildConteoAmbitoView(slug, nombre, resultado?.input),
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("[onpe/conteo]", slug, error);
    return NextResponse.json(
      { error: "ONPE no respondió" },
      { status: 502, headers: { "Cache-Control": "public, s-maxage=10" } }
    );
  }
}
