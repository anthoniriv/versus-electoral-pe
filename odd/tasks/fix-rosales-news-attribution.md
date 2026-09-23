# Fix Rosales news attribution

## Objective

Prevent news about Joel Rosales Pacheco from being attributed to Aldo Horacio Rosales Pacheco, and remove any existing incorrect production records.

## Problem

Candidate-scoped searches currently accept a shared surname keyword (`Rosales Pacheco`). When that gate rejects a result, the generic fallback can still reassign the same result to the suggested candidate through the same substring match.

## Why

Incorrect identity attribution is a data-integrity failure, especially for corruption and criminal-news reporting.

## Authorized scope

- Update local matching and candidate-scoped fallback behavior.
- Add regression coverage for Aldo versus Joel Rosales Pacheco.
- Inspect, delete, and verify the incorrect production row(s) in the configured Supabase database after the user confirms the credential/session to use.

## Constraints

- Preserve valid short-name matches such as `Rosselli Amuruz`.
- Generated municipal candidate data must not be edited by hand.
- Do not execute remote operations without explicit authorization for the credential/session.
- TDD mode: unknown (no project/session configuration found). Use ordinary regression checks with the existing `node:test` + `tsx` pattern.
- Test runner: `npx tsx --test tests/news-attribution.test.ts`.

## Tasks

- [x] **RNA-1 — Harden candidate-scoped identity matching**
  - Reject a matched surname pair when an adjacent proper-name token conflicts with the suggested candidate identity.
  - Do not run the broad all-candidate fallback after a candidate-scoped result fails identity validation.
  - Acceptance: the reported Joel headline cannot resolve to Aldo; valid Aldo and Rosselli examples still resolve.
- [x] **RNA-2 — Add and run regression checks**
  - Add focused unit tests for the identity gate and candidate selection behavior.
  - Run the focused test, lint/type checks applicable to changed files, and record results.
- [x] **RNA-3 — Clean and verify Supabase production data**
  - Confirm the authorized Supabase credential/session.
  - Identify all Aldo rows referring to Joel Rosales Pacheco, delete only confirmed false attributions, and verify zero remain.
- [x] **RNA-4 — Publish and invalidate the stale candidate page**
  - Deploy the local attribution fix through the configured Vercel project/session after explicit remote authorization.
  - Verify the published Aldo page no longer contains `Joel Rosales Pacheco` and is no longer serving the stale prerendered artifact.

## Progress

- Exploration confirmed the root cause in `src/lib/scraper.ts`: `matchCandidatoSugerido` accepts any keyword substring, and rejection falls through to `seleccionarCandidato`, which can reselect the same candidate.
- The generated candidate entry correctly identifies Aldo; the problematic ambiguous keyword is expected generated data, so the fix belongs in attribution logic rather than `src/lib/municipales-data.ts`.
- Added `src/lib/news-attribution.ts` with identity-conflict detection and candidate-scoped resolution that does not fall through to broad matching after a rejection.
- Added focused coverage in `tests/news-attribution.test.ts` for Joel/Aldo, valid Aldo, valid Rosselli Amuruz, and unscoped broad matching.
- Inspected the authorized Supabase database and found four confirmed Joel Rosales Pacheco rows assigned to Aldo (IDs 13424, 13425, 13467, and 16658). Deleted those four rows transactionally.
- Verified the public page still serves the deleted rows from Vercel ISR: `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`, `age: 32664`; the route has `revalidate = 86400`.
- Added `.vercelignore` for the local `.codegraph/` socket after the first packaging attempt failed on `daemon.sock`.
- Deployed the verified local state to Vercel production (`dpl_Eu2ToxYVffGLSKTcGyiXDT6f8iDx`) and confirmed the production aliases are active.

## Verification evidence

- `npx tsx --test tests/news-attribution.test.ts` — 4 passed, 0 failed.
- `npx eslint src/lib/news-attribution.ts src/lib/scraper.ts tests/news-attribution.test.ts` — passed.
- `npx tsc --noEmit` — passed.
- CodeGraph confirms `resolveCandidateAttribution` is called from the scraper and covered by `tests/news-attribution.test.ts`.
- Supabase cleanup transaction — deleted 4 confirmed rows; post-delete count for Aldo rows mentioning `Joel Rosales Pacheco` is 0.
- Public HTML check — stale response still contains Joel because Vercel is serving the prerendered page cache.
- Vercel production deployment — Ready at `https://versus-electoral-pe-bmuv-3iad2dinv-anthonirivs-projects.vercel.app`, aliased to `https://www.versuselectoral.com`.
- Browser verification — the published Aldo page shows `0 noticias` and `No se han encontrado noticias relevantes`; `Joel Rosales Pacheco` is absent.

## Next step

Deliver the verified production result.
