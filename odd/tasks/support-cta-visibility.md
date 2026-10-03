# Support CTA Visibility

## Objective

Make the "Apóyanos" donation path always reachable without interrupting users, so traffic peaks translate into support for an independent, ad-free site.

## Problem

"Apóyanos" only appears in the footer (`src/components/FooterApoyanos.tsx`, rendered from `src/app/layout.tsx`) and on `/apoyanos`. Most visitors never see it.

## Why

The user decided against advertising to protect the site's neutrality, so donations are the funding path. Asking for support right after a user gets value converts better and erodes less trust than interrupting them on arrival.

## Authorized Scope

- A persistent, compact "Apóyanos" link in the site header on every page.
- A support card at the end of comparison results and candidate profiles.
- Separate branch and PR, started after `feat/home-search-redesign` is delivered.

## Out of Scope (deferred)

- A one-time modal after the first completed comparison, with a ~30-day dismissal stored in the browser. Revisit only if the header link and the end-of-content cards underperform.
- An always-on or on-arrival modal. The user agreed to rule it out.

## Constraints

- Non-blocking: no overlays, and no layout shift in the reading area.
- Copy stays in neutral Spanish, stating the site is independent and ad-free.
- Links go to the existing `/apoyanos` page; reuse `KofiDonateCard`/`ApoyanosContent` patterns where they fit.
- Accessible: real links, visible focus, adequate contrast, and works at 320px.

## TDD

- Mode: unknown; runner `npx tsx --test`; ordinary functional checks apply.

## Tasks

- [x] **SCV-1: Header link.** (Delivered in `feat/home-search-redesign` at the user's request.) Add a compact "Apóyanos" link to the header in `src/app/layout.tsx`, desktop and mobile.
- [ ] **SCV-2: End-of-content card.** (Partial: the reusable `src/components/SupportCard.tsx` exists and is on the home page, delivered in `feat/home-search-redesign`; comparison results and profiles are still pending.) A reusable support card shown after comparison results (`MunicipalComparison`, `VersusSelector`) and at the end of candidate profiles.
- [ ] **SCV-3: Verify.** ESLint, `tsc`, tests, and Playwright screenshots at 1440px and 390px.

## Acceptance Criteria

- "Apóyanos" is visible in the header on every page without scrolling.
- After a completed comparison or at the end of a profile, the user sees one support card linking to `/apoyanos`.
- No modal or overlay is introduced.

## Progress

- Scope agreed with the user (2026-10-02); queued behind the home search redesign.

## Next Step

SCV-2, on a new branch after the home redesign PR.
