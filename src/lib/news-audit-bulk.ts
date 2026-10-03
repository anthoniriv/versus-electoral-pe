export const BULK_QUEUE_LIMIT = 500;

export const BULK_ELECTIONS = ["presidencial-2026", "municipal-2026"] as const;
export type BulkElection = (typeof BULK_ELECTIONS)[number];

export type PendingQueueScope =
  | { kind: "election"; election: BulkElection }
  | { kind: "candidate"; candidate: string };

export type PendingQueueWhere = {
  id: { notIn: number[]; gt?: number };
  candidato: { eleccion: BulkElection } | { slug: string };
};

export class BulkQueueInputError extends Error {}

export function parsePendingQueueScope(params: URLSearchParams): PendingQueueScope {
  const election = params.get("election")?.trim() ?? "";
  const candidate = params.get("candidate")?.trim() ?? "";

  if ((election && candidate) || (!election && !candidate)) {
    throw new BulkQueueInputError("Provide exactly one election or candidate scope");
  }
  if (election) {
    if (!BULK_ELECTIONS.includes(election as BulkElection)) {
      throw new BulkQueueInputError("Unsupported election scope");
    }
    return { kind: "election", election: election as BulkElection };
  }
  if (candidate.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(candidate)) {
    throw new BulkQueueInputError("Invalid candidate scope");
  }
  return { kind: "candidate", candidate };
}

export function buildPendingQueueWhere(
  scope: PendingQueueScope,
  auditedIds: number[],
  afterId?: number,
): PendingQueueWhere {
  return {
    id: {
      notIn: [...new Set(auditedIds)],
      ...(afterId ? { gt: afterId } : {}),
    },
    candidato: scope.kind === "election"
      ? { eleccion: scope.election }
      : { slug: scope.candidate },
  };
}

export function describePendingQueue(
  rows: Array<{ id: number }>,
  total: number,
  limit = BULK_QUEUE_LIMIT,
) {
  const ids = rows.slice(0, limit).map(({ id }) => id);
  const truncated = rows.length > limit;
  return {
    ids,
    total,
    truncated,
    limit,
    nextCursor: truncated ? ids.at(-1) ?? null : null,
  };
}
