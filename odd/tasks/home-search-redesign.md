# Home Search Redesign

## Objective

Make the home page a search-first entry point: users find a candidate or district immediately, see the most-mentioned candidates, and reach comparison through one clear path.

## Problem

A Playwright review (desktop 1440px, mobile 390px) found:

- No way to search by candidate name; the only entry is a native select of 43 municipalities.
- Five different content widths (672 / 504 / 896 / 672 / 768px), all centered, so blocks look misaligned.
- The "Versus" CTA card duplicates the MunicipalEntry block.
- MunicipalEntry is unbalanced: a sparse select column next to five optional priority radios.
- On mobile, the hero and stats push every actionable control below the fold.
- Card motion uses `transition-all duration-300` and ungated `hover:scale`, with no press feedback.

## Why

The user's primary intent is "find this candidate" or "see my district". The page should serve that intent first and reduce competing actions.

## Authorized Scope

- Redesign `src/app/page.tsx` and the components it uses.
- Add a client-side search over candidates and districts (static roster data; no new API calls).
- Add a "Más mencionados" ranking computed from the existing `Noticia` counts per municipal candidate. Label it honestly: it reflects news mentions, not searches.
- Keep one secondary "Comparar candidatos" link on the home page; remove the duplicated CTA cards.
- Add a "Compare with another candidate in <district>" action on the municipal candidate profile.
- Apply the motion fixes from the review.

## Out of Scope

- A real "most searched" ranking. GA4 is installed (`src/components/GoogleAnalytics.tsx`), so page-view data could come from the GA4 Data API later; that needs credentials and is not part of this change.
- No new database tables, no per-visit writes, and no change to the ISR strategy (`revalidate = 86400` plus cron `revalidatePath`).

## Constraints

- A single content container width across the home page.
- One primary action per row; no per-row VS buttons.
- Search results are links; keyboard accessible (combobox/listbox semantics, arrow keys, Enter, Escape).
- Hover effects are gated behind `@media (hover: hover) and (pointer: fine)`; pressables get `active:scale-[0.97]`; transitions name exact properties and stay under 300ms.
- The search box must be visible in the first mobile viewport (390x844).
- UI copy stays in neutral Spanish, matching the existing site.
- Carry over the HU-003 accessibility bar: labeled combobox with popup/option semantics, a live result-count announcement, stable focus, and reflow without truncation at 320px and 200% zoom. `MunicipalEntry` keeps serving `/alcaldes/versus`.

## TDD

- Mode: unknown; no explicit project or session TDD setting was found.
- Runner: `npx tsx --test`; ordinary functional checks apply.

## Tasks

- [x] **HSR-1: Search model and tests.** Pure search/normalization helper (accent- and case-insensitive) over candidates and districts, with unit tests.
- [x] **HSR-2: Home search UI.** Accessible search combobox as the hero centerpiece; results link to the candidate profile or district page.
- [x] **HSR-3: "Más mencionados" ranking.** Server-side grouped news count for municipal candidates (top 5), rendered as linked rows with a safe fallback when the database is unavailable.
- [x] **HSR-4: Layout and motion cleanup.** One container width, stats below search, remove duplicated CTA cards, one secondary compare link, motion fixes.
- [x] **HSR-5: Profile compare action.** "Comparar con otro candidato de <distrito>" on the municipal candidate profile, linking to the existing versus flow.
- [x] **HSR-6: Verify.** Unit tests, ESLint, `tsc`, and Playwright screenshots at 1440px and 390px.

## Acceptance Criteria

- Typing part of a candidate or district name (with or without accents) shows matching results that navigate correctly.
- Every home block shares the same left and right edges at desktop width.
- The search input is visible without scrolling at 390x844.
- The ranking shows up to five municipal candidates by news count and does not break the page if the database fails.
- The home page has exactly one compare entry point; the profile page offers comparison within the candidate's district.

## Progress

- Review completed and scope agreed with the user (2026-10-02).
- Branch: `feat/home-search-redesign`.
- HSR-1 done: added `src/lib/home-search.ts` (buildHomeSearchIndex, searchHome) and `tests/home-search.test.ts`. `npx tsx --test tests/home-search.test.ts`: 11 pass, 0 fail. Lima Metropolitana resolves to `/alcaldes` (no dedicated distrito page exists for it); Lima Cercado keeps `/alcaldes/distrito/lima-cercado`.
- HSR-2 done: `src/components/HomeSearch.tsx`, a client combobox (WAI-ARIA list-autocomplete pattern) wired into the hero. Only the minimal serialized `HomeSearchEntry[]` is passed from the server.
- HSR-3 done: `src/lib/mas-mencionados.ts` (`obtenerMasMencionados`, Prisma `noticia.groupBy` joined to the municipal roster, try/catch returns `[]` on DB failure) + `src/components/MasMencionados.tsx` (hidden when empty). Section titled "Más mencionados en las noticias" with a subtitle clarifying it is not a "most searched" ranking. `revalidate = 86400` kept; no new tables or per-visit writes.
- HSR-4 done: rewrote `src/app/page.tsx` — one `max-w-4xl` container end to end (hero, search, stats, ranking, compare link, FAQ), order hero → search → stats → ranking → "Comparar candidatos" link → FAQ, removed the two CTA cards and the `MunicipalEntry` block from the home (component untouched, still used by `/alcaldes/versus`). No `transition-all` left in the touched files; hover transforms gated behind `[@media(hover:hover)_and_(pointer:fine)]:hover:*`; pressables use `active:scale-[0.97]`; reduced motion already handled globally in `globals.css`.
- HSR-5 done: `src/components/CandidatoDetalleClient.tsx` gained optional `compareHref`/`compareZonaLabel` props, rendered only when set (so `/candidato/*` is unaffected). `src/app/alcaldes/[slug]/page.tsx` builds `compareHref` with the existing `buildMunicipalComparisonUrl({ ambito }, validAmbitos)` from `src/lib/municipal-entry.ts` — that flow only accepts `ambito`/`prioridad`, so the candidate itself can't be preselected; the user still picks both sides from the district's roster via `MunicipalComparison`.
- Verification: `npx tsx --test tests/home-search.test.ts` → 11 pass, 0 fail. `npx tsx --test tests/*.test.ts` → 56 pass, 0 fail. `npx tsc --noEmit` → clean. `npx eslint src/app/page.tsx src/app/alcaldes src/components src/lib tests/home-search.test.ts` → 0 problems.

- HSR-6: Playwright review found two leftovers, both fixed inline: content widths still differed (search 576, stats 504, ranking 736px), now all 768px at the same left edge (336px) on 1440px; the search placeholder named a real presidential candidate, replaced with a neutral "Ej. López, Miraflores…". Search "lopez" returns district-labelled candidates at 390x844; the search box is above the fold at 390x844; no horizontal overflow at 320px.
- HSR-6: `npx tsx --test tests/*.test.ts`: 56/56 passed; `npx tsc --noEmit`: clean; ESLint on the touched files: clean.

- User review (localhost) feedback, all addressed: (1) search by political party; the party was already indexed, but results now show "District · Party" and the label/placeholder say so; added a party-search test. (2) The results popover was clipped by the hero's `overflow-hidden`; the gradients moved into their own clipped layer and the listbox scrolls (max 60vh). (3) "Comparar candidatos" moved directly under the search (bottom of the link at 405px on 390x844). (4) The "Apóyanos" header link was pulled forward from SCV-1 into this branch (see `support-cta-visibility.md`).
- Checks after feedback: `npx tsx --test tests/*.test.ts`: 57/57; `tsc` clean; ESLint clean on touched files; Playwright: "somos peru" lists 8 Somos Perú candidates without clipping at 1440px; header heart link visible at 390px.

- User feedback round 2 ("avanza pais" showed no Lima candidate; Lima should always come first): results were capped at 8 and sorted alphabetically. Ranking now adds +50 for Lima Metropolitana entries, +15 for a whole-word district match and +30 for an exact district query (so "miraflores" beats "San Juan de Miraflores"); the cap went from 8 to 20 and the list ends with "Y N más…" plus a live "Mostrando X de Y" count. Tests: 60/60 (3 new ranking tests); tsc and ESLint clean; in the browser, "avanza pais" puts Francis Allison (Lima Metropolitana) first and shows 20 of 32.

- User feedback round 3 (the home page never mentioned support): added the reusable `SupportCard` ("Este sitio es independiente y no tiene publicidad" + Apóyanos button), aligned at 768px. First placed below the ranking; the user said it was too far down, so it moved above the ranking. Its button now sits in the first viewport (bottom at 694px on 1440x900 and 804px on 390x844). tsc and ESLint clean; Playwright checked at 1440px and 390px.

- User request (scope added): refocused `/apoyanos` on donations. The page now opens with "Mantén este proyecto independiente" and puts Yape/Plin and Ko-fi in the first section, followed by "Qué cubre tu aporte" (servers, news monitoring, development) and then "Quiénes somos" (OniLabs and OniGrowth moved down). The mission now says "presidenciales y municipales" (it previously said presidential only), the metadata description is donation-focused, and the Ko-fi heading changed from h3 to h2 for heading order. tsc and ESLint clean; Playwright checked at 1440px and 390px with no horizontal overflow.

- User feedback: the "Quiénes somos" OniLabs text was outdated. It now uses the current positioning from onilabs.site ("laboratorio de programación especializado en desarrollo web, móvil, microservicios y ecommerce", fetched 2026-10-02). The OniGrowth link and modal were removed from `/apoyanos`; `src/components/OnigrowthModal.tsx` is now unused but kept.

- User feedback (HSR-5 follow-up): "Compare" from a profile made the visitor pick the candidate again. Added an optional `candidato` query param: `buildMunicipalComparisonUrl` and `parseMunicipalComparisonQuery` handle it (slug-validated; a malformed value is dropped without invalidating the district). The versus page only preselects a candidate who runs in that municipality, the Cercado normalization keeps the param, and `viewReducer`'s `scope` action now keeps the preselected left side while the roster loads (previously it cleared it). Tests: 63/63 (3 new); tsc and ESLint clean. In the browser, "Comparar con otro candidato de Miraflores" from Alexander Von Ehren's profile opens with him in "Candidatura 1" and disabled in "Candidatura 2".

- User request: added a "Conoce tu local de votación" button next to "Comparar candidatos", linking to the official ONPE lookup `https://consultaelectoral.onpe.gob.pe/inicio` (URL verified through press coverage plus an HTTP check; it opens in a new tab and we never collect the DNI). tsc and ESLint clean. Side effect: at 390x844 the support card's button now ends at 864px, just below the fold.
- Declined for now: a public mock-vote page. Art. 191 of Ley 26859 prohibits publishing voting simulations on digital portals from the Sunday before election day (ERM 2026 is on 2026-10-04), with fines of 10–100 UIT.

- User request: added an election countdown to the hero (`src/lib/election-countdown.ts` plus `src/components/ElectionCountdown.tsx`). The target is ONPE polling hours, 2026-10-04 7:00–17:00 Peru time (UTC-5). It has three phases: countdown, "Hoy se vota · las mesas cierran a las 17:00" (with time left), and "ya terminó". The clock starts client-side to avoid hydration mismatch on the ISR page; ticking digits are aria-hidden and the schedule text carries the meaning. Tests: 67/67 (4 new); tsc and ESLint clean. In the browser, the countdown renders and the simulated voting phase (2026-10-04 14:30) reads correctly. At 390x844 the search ends at 456px, and the support card now starts near the bottom of the first viewport.

- User feedback: the countdown was too much information and "Faltan para votar" felt harsh. It is now one muted line with no box and no seconds: "Votamos el domingo 4 de octubre, en 1 día y 10 horas" (at most two units, Spanish plurals, refreshes every 30s). Election-day text is "Hoy votamos · las mesas cierran a las 17:00"; after closing it reads "ya cerró". Tests: 68/68; tsc and ESLint clean; checked at 1440px and 390px (fits one line on mobile).

- User decision: removed the "Más mencionados en las noticias" ranking (HSR-3) because, with the search in place, it added no value. Deleted `src/components/MasMencionados.tsx` and `src/lib/mas-mencionados.ts`; the home page goes back to a single news-count query. Tests: 68/68; tsc and ESLint clean; the page renders without the section.

- User decision (ads): removed every "sin publicidad" claim (SupportCard title, `/apoyanos` hero, metadata). Added an Adsterra Smartlink (`src/lib/smartlink.ts`, `src/components/SmartlinkLink.tsx`). On the first qualifying click of a browser session it opens in a new tab while the visitor's own navigation continues. Qualifying clicks: home "Comparar candidatos", the header Apóyanos link, the SupportCard button, and the footer Apóyanos button. The flag lives in sessionStorage, with an in-memory fallback, and modified clicks are ignored. Search results deliberately do not trigger it. Tests: 71/71 (3 new); tsc and ESLint clean. Browser check with the ad domain blocked (to avoid fake impressions): first Compare opens 1 tab, then later Apóyanos and Compare open none, and a fresh session's support card opens 1.

- User feedback round (ads, countdown, Ko-fi):
  1) The profile "Comparar con otro candidato de…" link also triggers the Smartlink.
  2) The Smartlink flag moved from sessionStorage to a session cookie (no Expires), so it holds across tabs and resets only when the browser closes, per the user ("del navegador", not per day).
  3) The countdown moved from the hero into the red top banner, replacing the scrolling marquee; mobile uses a compact form ("Votamos el domingo 4, en 1 día y 10 horas").
  4) "Donar en Ko-fi" now opens ko-fi.com/onilabs directly in a new tab; the intermediate thank-you modal was removed and KofiDonateCard is no longer a client component.
  Tests: 71/71; tsc and ESLint clean. Browser check with the ad and Ko-fi domains blocked: profile compare opens 1 ad tab; a second tab in the same session opens 0; Ko-fi opens 1 tab; the banner text renders at 1440px and 390px. `.animate-marquee` in globals.css is now unused.

- User corrections:
  1) Keep the scrolling banner and add the countdown into it instead of replacing the text. Each segment is now "<countdown> · ELECCIONES MUNICIPALES 2026 · …", rendered twice (the copy is aria-hidden). The marquee keyframes changed from `translateX(100%)→(-100%)` to a seamless `0→-50%` at 45s, which removes the empty gap that started every loop. Mobile scrolls too.
  2) The Smartlink was removed from all Apóyanos buttons (header, SupportCard, footer); it now triggers only on home "Comparar candidatos" and the profile compare link.
  3) Ko-fi card: as an `<a>` it lost the vertical centering the old `<button>` gave it in the stretched grid cell; it is now a flex column, full height and centered.
  Note: Turbopack served stale globals.css until `.next` was cleared and the dev server restarted. Tests: 71/71; tsc and ESLint clean; screenshots confirm the banner text is visible at load at 1440px and 390px.

- User request: public visitor counters in the footer. `src/lib/site-visitors.ts` reads GA4 server-side (realtime activeUsers over the last 30 min plus today's activeUsers) and never throws. `GET /api/visitantes` serves only the two numbers with `Cache-Control: public, s-maxage=1800`, so GA is hit roughly every 30 minutes, not per visit. `FooterVisitors` renders "N visitantes hoy · M en los últimos 30 min" in the desktop and mobile footers and hides itself when data is unavailable. Credentials come from server env vars only: `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_JSON` (Vercel) or `GA4_KEY_FILE` (local), documented in `.env.example`. Added the `@google-analytics/data` dependency. Tests: 73/73 (2 new); tsc and ESLint clean. A local run with the key returned {activeNow: 257, visitorsToday: 4054}, and the footer renders at 1440px and 390px. Production needs the two env vars set in Vercel.

## Next Step

User visual review on localhost, then commit and open a PR. Follow-up feature queued: `odd/tasks/support-cta-visibility.md`.
