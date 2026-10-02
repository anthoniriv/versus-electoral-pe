# Local News Ownership Audit

## Objective

Provide a local-only admin workspace that uses TypeSafe AI's Jev model to review whether each stored news item belongs to its assigned candidate, while keeping every destructive database action under human control.

## Problem

The scraper can associate a story with the wrong person when candidates share surnames or public roles. The public correction for Aldo Horacio Rosales Pacheco showed that this is a systemic data-quality risk, but the project has no moderation surface or durable audit trail.

## Why

A bounded, reviewable audit workflow is safer than one-off database cleanup. TypeSafe Jev can return a typed ownership verdict and probabilities, but its result is evidence for a human reviewer rather than authorization to delete or reassign records.

## Authorized Scope

- Build a local admin route and local API for reviewing stored candidate-news assignments.
- Call TypeSafe's System One API from server-only code with `TYPESAFE_API_KEY` and the Jev model.
- Persist audit results and human confirmations to a gitignored local JSON store.
- Add deterministic attribution evidence and typed Jev verdicts.
- Do not deploy the admin, mutate Supabase, delete news, or push/commit changes as part of this feature.

## Constraints

- The admin page and API must return 404 in production and for non-loopback hosts.
- The TypeSafe key must never reach client code, logs, source control, or stored audit results.
- Jev evaluates only the candidate and news evidence supplied by the app.
- `DOES_NOT_BELONG` and `UNCERTAIN` must require human review. No model verdict may directly change `Noticia`.
- Calls are processed in small batches to control cost and make progress observable.
- UI follows the existing dark civic visual language and must be keyboard accessible.

## TDD

- Mode: unknown; no explicit project or session TDD setting was found.
- Runner: `npx tsx --test` for unit tests; ordinary functional checks apply.

## Tasks

- [x] **JNA-1 — Define the audit contract and AutoJev client**
  - Add typed verdict/result models, compact request construction, strict response parsing, deterministic evidence, and safe failure handling.
  - Add unit coverage for request shape, response validation, and homonym evidence.
- [x] **JNA-2 — Add local-only storage and API boundaries**
  - Add loopback/development guards, paginated candidate-news reads, single-item evaluation, and local JSON persistence.
  - Ensure concurrent writes are serialized and malformed local state fails safely.
- [x] **JNA-3 — Build the local review desk UI**
  - Add `/local-admin/news-audit` with summary counts, filters, pagination, evidence, AutoJev probabilities, and explicit human review controls.
  - Support evaluating one item or the visible page sequentially with clear progress and errors.
- [x] **JNA-3B — Add safe bulk evaluation scopes**
  - Allow queued evaluation of all pending presidential news, all pending municipal news, or all pending news for the selected candidate.
  - Show the exact queue size before starting, process sequentially, persist progress after every item, and provide a cancel control.
  - Skip already audited records by default to avoid duplicate AutoJev cost.
- [x] **JNA-3C — Stop cascading AutoJev failures and surface diagnostics**
  - Preserve the upstream AutoJev status and safe error message without exposing credentials or response bodies containing secrets.
  - Retry transient failures with bounded backoff, but stop a bulk queue after three consecutive failures so systemic errors cannot burn through the entire scope.
  - Show the last failure and stopped reason in the batch status so the operator can correct configuration or wait before resuming.
- [x] **JNA-3D — Replace the mistaken AutoJev provider with direct TypeSafe Jev**
  - Send the ownership request to `POST https://api.typesafe.ai/v1/systemone` with `TYPESAFE_API_KEY` and a configurable Jev model defaulting to `jev-latest`.
  - Parse TypeSafe's direct System One response and validation errors instead of the incompatible AutoJev response envelope.
  - Rename provider-specific client/error symbols and update environment documentation and contract tests.
- [x] **JNA-4 — Verify the complete local workflow**
  - Run focused unit tests, ESLint, TypeScript, and a local browser smoke test.
  - Confirm production/non-loopback guards, key secrecy, and that no database mutation is exposed.

## Acceptance Criteria

- A developer on localhost can browse assigned news, filter it, and request a Jev verdict.
- Each verdict is one of `BELONGS`, `DOES_NOT_BELONG`, or `UNCERTAIN`, with confidence/probabilities and model metadata when available.
- Audit results survive local dev-server restarts without changing the Prisma schema or remote database.
- A reviewer can confirm or override the machine verdict locally; no action deletes or reassigns a news record.
- A reviewer can start, monitor, cancel, and later resume a presidential, municipal, or candidate-scoped pending audit without reevaluating completed records.
- Production builds expose neither a usable page nor a usable API for this tool.
- All applicable checks and any skipped live TypeSafe call are reported honestly.

## Verification Evidence

- JNA-1: `npx tsx --test tests/news-ownership-audit.test.ts` — 5/5 passed.
- JNA-1: ESLint for the owned source and test files — passed.
- JNA-1: `npx tsc --noEmit` — passed.
- JNA-1: no live AutoJev request was made; the client is covered with injected-response unit tests.
- JNA-2: `npx tsx --test tests/local-admin.test.ts tests/news-ownership-audit.test.ts` — 10/10 passed.
- JNA-2: targeted ESLint and `npx tsc --noEmit` — passed.
- JNA-2: loopback/production guards, serialized atomic writes, malformed-file preservation, and secret exclusion are covered by tests.
- JNA-3: targeted ESLint and `npx tsc --noEmit` — passed.
- JNA-3: page and API use server-side production/loopback guards; no live database or AutoJev request has been made yet.
- JNA-3B: `npx tsx --test tests/news-audit-bulk.test.ts tests/local-admin.test.ts tests/news-ownership-audit.test.ts` — 14/14 passed.
- JNA-3B: targeted ESLint and `npx tsc --noEmit` — passed.
- JNA-3B: pending queues are scoped by election or candidate, paged in blocks of 500, skip audited IDs, persist each success, continue past failures, and can be cancelled/resumed.
- JNA-3C: `npx tsx --test tests/news-ownership-audit.test.ts tests/news-audit-resilience.test.ts tests/news-audit-bulk.test.ts tests/local-admin.test.ts` — 21/21 passed.
- JNA-3C: targeted ESLint and `npx tsc --noEmit` — passed.
- JNA-3C: transient responses retry at most twice with bounded backoff; queues circuit-break after three consecutive failed items and show a sanitized upstream reason.
- JNA-3D: `npx tsx --test tests/news-ownership-audit.test.ts tests/local-admin.test.ts tests/news-audit-resilience.test.ts tests/news-audit-bulk.test.ts` — 22/22 passed.
- JNA-3D: targeted ESLint and `npx tsc --noEmit` — passed.
- JNA-3D: the client now sends the required `model` to TypeSafe's direct `/v1/systemone` endpoint, parses the direct response, and safely summarizes `detail` validation errors; no live TypeSafe request was made.
- JNA-4: user-operated localhost smoke test completed 1,602 municipal evaluations with 0 failures; the local store contained 1,603 total evaluations including the earlier single-item test.
- JNA-4: local-only guards, credential secrecy, and absence of database mutation endpoints remain covered by the focused tests; the user separately authorized a one-time cleanup outside the admin workflow.

## Progress

- The original provider assumption was incorrect: AutoJev's hosted API is not the user's TypeSafe AI credential target.
- TypeSafe's official OpenAPI contract was verified at `https://api.typesafe.ai/openapi.json`: `POST /v1/systemone`, Bearer auth, required `model`, and a direct `{ model, answers, usage }` response.
- Existing App Router, Prisma models, database client, styles, API patterns, and test runner inspected.
- JNA-1 completed with a strict typed parser, compact Decisions request, deterministic homonym evidence, and server-only credential handling.
- JNA-2 completed with a local-only paginated API, per-item evaluation, human override, and a gitignored JSON audit trail; it exposes no database mutation.
- JNA-3 completed with filters, summary counts, evidence cards, Jev probabilities, sequential page evaluation, and explicit human confirmations/overrides.
- JNA-3B completed with exact-count confirmation, all-pending presidential/municipal/candidate queues, cursor-based continuation across safe blocks, progress/failure reporting, and an accessible cancelable dialog.
- Live evidence found a resilience defect: repeated upstream failures were flattened to local HTTP 502 and the queue continued until a later item succeeded, hiding the root cause and wasting calls.
- JNA-3C fixed the confirmed local defect. The precise upstream cause remains unverified until the user restarts the dev server and reproduces one item with the newly surfaced diagnostic.
- JNA-3D replaced the incompatible AutoJev endpoint/envelope with TypeSafe's official System One contract and documented `TYPESAFE_API_KEY`, `TYPESAFE_JEV_MODEL`, and `TYPESAFE_BASE_URL`.
- JNA-4 completed after the user successfully ran the full municipal queue on localhost with no failures.

## Next Step

The local audit feature is verified. Any future database remediation must remain an explicit, separately authorized operation with a recoverable backup.
