import { NextResponse } from "next/server";
import { ejecutarScraping } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  // Verificar API key simple
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.SCRAPE_API_KEY || "dev-key-123";

  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await ejecutarScraping();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
