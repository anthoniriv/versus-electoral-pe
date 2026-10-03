import assert from "node:assert/strict";
import test from "node:test";
import {
  auditRetryDelayMs,
  shouldStopAuditBatch,
  shouldRetryAuditError,
} from "../src/components/local-admin/NewsAuditDesk";

test("retries only explicit transient evaluation failures with a bounded attempt count", () => {
  assert.equal(shouldRetryAuditError(429, true, 0), true);
  assert.equal(shouldRetryAuditError(503, true, 1), true);
  assert.equal(shouldRetryAuditError(503, true, 2), false);
  assert.equal(shouldRetryAuditError(503, false, 0), false);
  assert.equal(shouldRetryAuditError(401, true, 0), false);
});

test("uses bounded exponential delays and honors Retry-After", () => {
  assert.equal(auditRetryDelayMs(0, null), 500);
  assert.equal(auditRetryDelayMs(1, null), 1_000);
  assert.equal(auditRetryDelayMs(0, "3"), 3_000);
  assert.equal(auditRetryDelayMs(1, "999"), 30_000);
  assert.equal(auditRetryDelayMs(1, "invalid"), 1_000);
});

test("opens the batch circuit after three consecutive failed items", () => {
  assert.equal(shouldStopAuditBatch(2), false);
  assert.equal(shouldStopAuditBatch(3), true);
  assert.equal(shouldStopAuditBatch(4), true);
});
