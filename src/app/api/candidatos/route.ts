import { NextResponse } from "next/server";
import { obtenerResumenCandidatos } from "@/lib/candidatos-resumen";

export const revalidate = 300;

export async function GET() {
  try {
    const result = await obtenerResumenCandidatos();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
