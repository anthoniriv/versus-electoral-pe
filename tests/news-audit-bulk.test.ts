import assert from "node:assert/strict";
import test from "node:test";
import {
  BULK_QUEUE_LIMIT,
  BulkQueueInputError,
  buildPendingQueueWhere,
  describePendingQueue,
  parsePendingQueueScope,
} from "../src/lib/news-audit-bulk";

test("parses supported election and candidate pending scopes", () => {
  assert.deepEqual(
    parsePendingQueueScope(new URLSearchParams("election=presidencial-2026")),
    { kind: "election", election: "presidencial-2026" },
  );
  assert.deepEqual(
    parsePendingQueueScope(new URLSearchParams("candidate=ana-perez")),
    { kind: "candidate", candidate: "ana-perez" },
  );
});

test("rejects missing, ambiguous, and unsupported scopes", () => {
  assert.throws(() => parsePendingQueueScope(new URLSearchParams()), BulkQueueInputError);
  assert.throws(
    () => parsePendingQueueScope(new URLSearchParams("election=municipal-2026&candidate=ana-perez")),
    BulkQueueInputError,
  );
  assert.throws(
    () => parsePendingQueueScope(new URLSearchParams("election=congreso-2026")),
    BulkQueueInputError,
  );
});

test("builds an unaudited-only database filter for each scope", () => {
  assert.deepEqual(
    buildPendingQueueWhere({ kind: "election", election: "municipal-2026" }, [2, 2, 7]),
    { id: { notIn: [2, 7] }, candidato: { eleccion: "municipal-2026" } },
  );
  assert.deepEqual(
    buildPendingQueueWhere({ kind: "candidate", candidate: "ana-perez" }, [4]),
    { id: { notIn: [4] }, candidato: { slug: "ana-perez" } },
  );
  assert.deepEqual(
    buildPendingQueueWhere({ kind: "candidate", candidate: "ana-perez" }, [4], 99),
    { id: { notIn: [4], gt: 99 }, candidato: { slug: "ana-perez" } },
  );
});

test("caps returned IDs while preserving the exact pending total", () => {
  const rows = Array.from({ length: BULK_QUEUE_LIMIT + 2 }, (_, index) => ({ id: index + 1 }));
  const queue = describePendingQueue(rows, rows.length);
  assert.equal(queue.ids.length, BULK_QUEUE_LIMIT);
  assert.equal(queue.total, BULK_QUEUE_LIMIT + 2);
  assert.equal(queue.truncated, true);
  assert.equal(queue.nextCursor, BULK_QUEUE_LIMIT);
});
