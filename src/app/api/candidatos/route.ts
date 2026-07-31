import { NextResponse, type NextRequest } from "next/server";
import { obtenerResumenCandidatos } from "@/lib/candidatos-resumen";
import { ELECCIONES, ELECCION_DEFAULT, type EleccionId } from "@/lib/elecciones";

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    const pedida = q.get("eleccion");
    const eleccion: EleccionId = ELECCIONES.some((e) => e.id === pedida)
      ? (pedida as EleccionId)
      : ELECCION_DEFAULT;
    const ambito = q.get("ambito") ?? undefined;

    const result = await obtenerResumenCandidatos({ eleccion, ambito });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
