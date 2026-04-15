import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ONPE_PARTICIPANTES_URL =
  "https://resultadoelectoral.onpe.gob.pe/presentacion-backend/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&tipoFiltro=eleccion";
const ONPE_TOTALES_URL =
  "https://resultadoelectoral.onpe.gob.pe/presentacion-backend/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion";

interface OnpeParticipante {
  nombreAgrupacionPolitica: string;
  codigoAgrupacionPolitica: string;
  nombreCandidato: string;
  dniCandidato: string;
  totalVotosValidos: number;
  porcentajeVotosValidos?: number;
  porcentajeVotosEmitidos?: number;
}

interface OnpeResponse {
  success: boolean;
  message: string;
  data: OnpeParticipante[];
}

interface OnpeTotales {
  actasContabilizadas: number;
  contabilizadas: number;
  totalActas: number;
  participacionCiudadana: number;
  totalVotosEmitidos: number;
  totalVotosValidos: number;
  fechaActualizacion: number;
}

const SLUG_BY_DNI: Record<string, string> = {
  "07845838": "rafael-lopez-aliaga",
  "06506278": "jorge-nieto-montesinos",
  "10001088": "keiko-fujimori",
  "06002034": "carlos-alvarez-loayza",
  "25331980": "alfonso-lopez-chau-nava",
  "09177250": "ricardo-belmont",
  "07867789": "marisol-perez-tello",
  "16002918": "roberto-sanchez-palomino",
  "06280714": "luis-olivera-vega",
  "18141156": "rosario-fernandez-bazan",
  "10266270": "carlos-espa",
  "41265978": "george-forsyth",
  "43632186": "pitter-valderrama",
  "41373494": "ronald-atencio-sotomayor",
  "01211014": "yonhy-lescano",
  "40728264": "roberto-chiabra",
  "09871134": "mesias-guevara",
  "06466585": "vladimir-cerron",
  "17903382": "cesar-acuna-peralta",
  "04411300": "mario-vizcarra-cornejo",
  "43409673": "herbert-caller",
  "40139245": "paul-jaimes-blanco",
  "07246887": "jose-luna-galvez",
  "09307547": "alex-gonzalez-castillo",
  "07260881": "wolfgang-grozo",
  "41904418": "alvaro-paz-de-la-barra",
  "10219647": "rafael-belaunde-llosa",
  "40799023": "charlie-carrasco",
  "25681995": "fiorella-molinelli",
  "08263758": "francisco-diez-canseco",
  "43287528": "jose-williams-zapata",
  "08058852": "napoleon-becerra",
  "06529088": "carlos-jaico",
  "08587486": "antonio-ortiz-villano",
  "18870364": "walter-chirinos",
  "08255194": "armando-masse",
};

export async function GET() {
  try {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      Referer: "https://resultadoelectoral.onpe.gob.pe/main/presidenciales",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    };
    const [resPart, resTot] = await Promise.all([
      fetch(ONPE_PARTICIPANTES_URL, { headers, cache: "no-store" }),
      fetch(ONPE_TOTALES_URL, { headers, cache: "no-store" }),
    ]);

    if (!resPart.ok || !resTot.ok) {
      return NextResponse.json(
        { success: false, message: `ONPE HTTP ${resPart.status}/${resTot.status}`, data: null },
        { status: 502 }
      );
    }

    const ctPart = resPart.headers.get("content-type") ?? "";
    const ctTot = resTot.headers.get("content-type") ?? "";
    if (!ctPart.includes("json") || !ctTot.includes("json")) {
      return NextResponse.json(
        { success: false, message: "ONPE devolvió HTML (bloqueo WAF o origen caído)", data: null },
        { status: 502 }
      );
    }

    const raw: OnpeResponse = await resPart.json();
    const totRaw: { success: boolean; data: OnpeTotales } = await resTot.json();
    if (!raw.success || !Array.isArray(raw.data) || !totRaw.success) {
      return NextResponse.json(
        { success: false, message: "Respuesta inválida ONPE", data: null },
        { status: 502 }
      );
    }

    const blancos = raw.data.find((p) => p.codigoAgrupacionPolitica === "80");
    const nulos = raw.data.find((p) => p.codigoAgrupacionPolitica === "81");

    const candidatos = raw.data
      .filter(
        (p) => p.nombreCandidato && p.codigoAgrupacionPolitica !== "80" && p.codigoAgrupacionPolitica !== "81"
      )
      .map((p) => ({
        nombre: p.nombreCandidato,
        partido: p.nombreAgrupacionPolitica,
        slug: SLUG_BY_DNI[p.dniCandidato] ?? null,
        votos: p.totalVotosValidos,
        porcentajeValidos: p.porcentajeVotosValidos ?? 0,
        porcentajeEmitidos: p.porcentajeVotosEmitidos ?? 0,
      }))
      .sort((a, b) => b.votos - a.votos);

    const tot = totRaw.data;

    return NextResponse.json(
      {
        success: true,
        actualizado: tot.fechaActualizacion
          ? new Date(tot.fechaActualizacion).toISOString()
          : new Date().toISOString(),
        totalValidos: tot.totalVotosValidos,
        totalEmitidos: tot.totalVotosEmitidos,
        blancos: blancos?.totalVotosValidos ?? 0,
        nulos: nulos?.totalVotosValidos ?? 0,
        actasContabilizadasPct: tot.actasContabilizadas,
        actasContabilizadas: tot.contabilizadas,
        totalActas: tot.totalActas,
        participacionCiudadana: tot.participacionCiudadana,
        candidatos,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[ONPE] Error:", err);
    return NextResponse.json(
      { success: false, message: "Error al consultar ONPE", data: null },
      { status: 500 }
    );
  }
}
