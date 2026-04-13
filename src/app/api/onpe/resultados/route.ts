import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ONPE_URL =
  "https://resultadoelectoral.onpe.gob.pe/presentacion-backend/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&tipoFiltro=eleccion";

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
    const res = await fetch(ONPE_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; VersusElectoralPeru/1.0)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `ONPE HTTP ${res.status}`, data: null },
        { status: 502 }
      );
    }

    const raw: OnpeResponse = await res.json();
    if (!raw.success || !Array.isArray(raw.data)) {
      return NextResponse.json(
        { success: false, message: raw.message || "Respuesta inválida ONPE", data: null },
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

    const totalValidos = candidatos.reduce((s, c) => s + c.votos, 0);
    const totalEmitidos = totalValidos + (blancos?.totalVotosValidos ?? 0) + (nulos?.totalVotosValidos ?? 0);

    return NextResponse.json(
      {
        success: true,
        actualizado: new Date().toISOString(),
        totalValidos,
        totalEmitidos,
        blancos: blancos?.totalVotosValidos ?? 0,
        nulos: nulos?.totalVotosValidos ?? 0,
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
