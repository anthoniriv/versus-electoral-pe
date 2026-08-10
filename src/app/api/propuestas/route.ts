import { NextResponse, type NextRequest } from "next/server";
import { obtenerPlanGobierno } from "@/lib/planes-gobierno";

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("candidato")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Falta el candidato" }, { status: 400 });
  }

  try {
    const plan = await obtenerPlanGobierno(slug);
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
