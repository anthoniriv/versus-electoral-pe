import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLocalAdminRequest } from "@/lib/local-admin";
import {
  BULK_QUEUE_LIMIT,
  BulkQueueInputError,
  buildPendingQueueWhere,
  describePendingQueue,
  parsePendingQueueScope,
} from "@/lib/news-audit-bulk";
import {
  readNewsOwnershipAudits,
  saveHumanOwnershipReview,
  saveMachineOwnershipAudit,
} from "@/lib/local-news-audit-store";
import {
  JevError,
  NEWS_OWNERSHIP_VERDICTS,
  buildNewsOwnershipEvidence,
  describeJevHttpError,
  evaluateNewsOwnership,
  type NewsOwnershipCandidate,
  type NewsOwnershipVerdict,
} from "@/lib/news-ownership-audit";

export const dynamic = "force-dynamic";

function rejectRemote(request: Request): NextResponse | null {
  return isLocalAdminRequest(request)
    ? null
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function candidateAliases(name: string): string[] {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  const surname = tokens.slice(-2).join(" ");
  return [...new Set([surname, `${tokens[0]} ${surname}`, name].filter((value) => value.length > 3))];
}

function candidateOffice(candidate: { eleccion: string; ambito: string | null; estado: string | null }): string {
  return [candidate.eleccion, candidate.ambito, candidate.estado].filter(Boolean).join(" · ");
}

function parseVerdict(value: unknown): NewsOwnershipVerdict | null {
  return typeof value === "string" && NEWS_OWNERSHIP_VERDICTS.includes(value as NewsOwnershipVerdict)
    ? value as NewsOwnershipVerdict
    : null;
}

export async function GET(request: NextRequest) {
  const rejected = rejectRemote(request);
  if (rejected) return rejected;

  try {
    const page = positiveInteger(request.nextUrl.searchParams.get("page"), 1, 100_000);
    const limit = positiveInteger(request.nextUrl.searchParams.get("limit"), 20, 50);
    const candidate = request.nextUrl.searchParams.get("candidate")?.trim();
    const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120);
    const status = request.nextUrl.searchParams.get("status")?.trim();
    const auditFile = await readNewsOwnershipAudits();
    const auditedIds = Object.values(auditFile.records).map((record) => record.newsId);

    if (request.nextUrl.searchParams.get("queue") === "pending") {
      try {
        const scope = parsePendingQueueScope(request.nextUrl.searchParams);
        const afterId = positiveInteger(request.nextUrl.searchParams.get("afterId"), 0, Number.MAX_SAFE_INTEGER);
        const where = buildPendingQueueWhere(scope, auditedIds, afterId || undefined);
        const [rows, total] = await Promise.all([
          prisma.noticia.findMany({
            where,
            select: { id: true },
            orderBy: { id: "asc" },
            take: BULK_QUEUE_LIMIT + 1,
          }),
          prisma.noticia.count({ where }),
        ]);
        return NextResponse.json(describePendingQueue(rows, total), {
          headers: { "Cache-Control": "no-store" },
        });
      } catch (error) {
        if (error instanceof BulkQueueInputError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        throw error;
      }
    }

    const matchingIds = Object.values(auditFile.records)
      .filter((record) => record.review?.verdict === status || record.machine?.result.verdict === status)
      .map((record) => record.newsId);

    const where: Prisma.NoticiaWhereInput = {
      ...(candidate ? { candidato: { slug: candidate } } : {}),
      ...(query ? {
        OR: [
          { titulo: { contains: query, mode: "insensitive" } },
          { descripcion: { contains: query, mode: "insensitive" } },
          { candidato: { nombre: { contains: query, mode: "insensitive" } } },
        ],
      } : {}),
      ...(status === "UNAUDITED" ? { id: { notIn: auditedIds } } : {}),
      ...(NEWS_OWNERSHIP_VERDICTS.includes(status as NewsOwnershipVerdict) ? { id: { in: matchingIds } } : {}),
    };

    const [news, total, candidates] = await Promise.all([
      prisma.noticia.findMany({
        where,
        include: { candidato: { select: { nombre: true, partido: true, slug: true, eleccion: true, ambito: true, estado: true } } },
        orderBy: [{ fechaNoticia: { sort: "desc", nulls: "last" } }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.noticia.count({ where }),
      prisma.candidato.findMany({
        where: { noticias: { some: {} } },
        select: { nombre: true, slug: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

    const counts = { audited: 0, BELONGS: 0, DOES_NOT_BELONG: 0, UNCERTAIN: 0 };
    for (const record of Object.values(auditFile.records)) {
      counts.audited++;
      const verdict = record.review?.verdict ?? record.machine?.result.verdict;
      if (verdict) counts[verdict]++;
    }

    return NextResponse.json({
      news: news.map((item) => ({ ...item, audit: auditFile.records[String(item.id)] ?? null })),
      candidates,
      summary: { ...counts, total: await prisma.noticia.count() },
      page,
      total,
      totalPages: Math.ceil(total / limit),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Local audit unavailable" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rejected = rejectRemote(request);
  if (rejected) return rejected;

  try {
    const body = await request.json() as { newsId?: unknown };
    if (!Number.isInteger(body.newsId) || (body.newsId as number) <= 0) {
      return NextResponse.json({ error: "A valid newsId is required" }, { status: 400 });
    }
    const news = await prisma.noticia.findUnique({
      where: { id: body.newsId as number },
      include: { candidato: true },
    });
    if (!news) return NextResponse.json({ error: "News item not found" }, { status: 404 });

    const candidate: NewsOwnershipCandidate = {
      nombre: news.candidato.nombre,
      keywords: candidateAliases(news.candidato.nombre),
      partido: news.candidato.partido,
      cargo: candidateOffice(news.candidato),
    };
    const evidence = buildNewsOwnershipEvidence(candidate, {
      titulo: news.titulo,
      resumen: news.descripcion,
      fuente: news.fuente,
      fechaNoticia: news.fechaNoticia,
      url: news.url,
    });
    const result = await evaluateNewsOwnership(evidence);
    const audit = await saveMachineOwnershipAudit(news.id, evidence, result);
    return NextResponse.json({ audit });
  } catch (error) {
    if (error instanceof JevError) {
      const details = describeJevHttpError(error);
      const retryAfterSeconds = details.retryAfterMs
        ? Math.max(1, Math.ceil(details.retryAfterMs / 1_000))
        : undefined;
      return NextResponse.json({
        error: error.message,
        code: error.code,
        transient: details.transient,
        ...(details.upstreamStatus ? { upstreamStatus: details.upstreamStatus } : {}),
      }, {
        status: details.status,
        ...(retryAfterSeconds ? { headers: { "Retry-After": String(retryAfterSeconds) } } : {}),
      });
    }
    return NextResponse.json({ error: "Evaluation failed" }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const rejected = rejectRemote(request);
  if (rejected) return rejected;

  try {
    const body = await request.json() as { newsId?: unknown; verdict?: unknown; note?: unknown };
    const verdict = parseVerdict(body.verdict);
    if (!Number.isInteger(body.newsId) || (body.newsId as number) <= 0 || !verdict) {
      return NextResponse.json({ error: "A valid newsId and verdict are required" }, { status: 400 });
    }
    const exists = await prisma.noticia.count({ where: { id: body.newsId as number } });
    if (!exists) return NextResponse.json({ error: "News item not found" }, { status: 404 });
    const audit = await saveHumanOwnershipReview(
      body.newsId as number,
      verdict,
      typeof body.note === "string" ? body.note : undefined,
    );
    return NextResponse.json({ audit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Review could not be saved" }, { status: 500 });
  }
}
