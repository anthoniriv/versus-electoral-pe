import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { isLocalAdminRequest, isLoopbackUrl } from "../src/lib/local-admin";
import {
  LocalAuditStoreError,
  readNewsOwnershipAudits,
  saveHumanOwnershipReview,
  saveMachineOwnershipAudit,
} from "../src/lib/local-news-audit-store";

test("accepts loopback URLs and rejects remote hosts", () => {
  assert.equal(isLoopbackUrl("http://localhost:3000/local-admin"), true);
  assert.equal(isLoopbackUrl("http://127.0.0.1:3000/local-admin"), true);
  assert.equal(isLoopbackUrl("http://[::1]:3000/local-admin"), true);
  assert.equal(isLoopbackUrl("http://192.168.1.2:3000/local-admin"), false);
  assert.equal(isLoopbackUrl("https://versuselectoral.com/local-admin"), false);
});

test("rejects every admin request in production", () => {
  assert.equal(
    isLocalAdminRequest(new Request("http://localhost:3000/api/local-admin"), "production"),
    false,
  );
});

test("persists machine and human audit data without secrets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "news-audit-"));
  const path = join(directory, "audit.json");
  process.env.TYPESAFE_API_KEY = "must-not-be-written";
  await saveMachineOwnershipAudit(42, {
    candidate: { name: "Aldo Rosales Pacheco", aliases: ["Rosales Pacheco"] },
    news: { headline: "Aldo presenta propuestas" },
    deterministic: { suggestedCandidateMatch: true },
  }, {
    verdict: "BELONGS",
    confidence: 0.91,
    probabilities: { BELONGS: 0.91, DOES_NOT_BELONG: 0.02, UNCERTAIN: 0.07 },
    model: "typesafe/jev-test",
  }, path);
  await saveHumanOwnershipReview(42, "BELONGS", "  Confirmed manually  ", path);

  const file = await readNewsOwnershipAudits(path);
  assert.equal(file.records["42"].review?.note, "Confirmed manually");
  assert.equal(file.records["42"].machine?.result.verdict, "BELONGS");
  assert.equal((await readFile(path, "utf8")).includes("must-not-be-written"), false);
});

test("serializes concurrent writes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "news-audit-"));
  const path = join(directory, "audit.json");
  await Promise.all([
    saveHumanOwnershipReview(1, "BELONGS", undefined, path),
    saveHumanOwnershipReview(2, "UNCERTAIN", undefined, path),
  ]);
  const file = await readNewsOwnershipAudits(path);
  assert.deepEqual(Object.keys(file.records).sort(), ["1", "2"]);
});

test("does not overwrite a malformed audit file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "news-audit-"));
  const path = join(directory, "audit.json");
  await writeFile(path, "not-json", "utf8");
  await assert.rejects(() => saveHumanOwnershipReview(1, "BELONGS", undefined, path), LocalAuditStoreError);
  assert.equal(await readFile(path, "utf8"), "not-json");
});
