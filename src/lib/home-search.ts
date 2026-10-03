import { normalize } from "./normalize";
import {
  AMBITO_PROVINCIAL,
  CANDIDATOS_MUNICIPALES,
  DISTRITOS_LIMA,
  DISTRITO_BY_SLUG,
  type CandidatoMunicipal,
} from "./municipales";

/**
 * Maximum number of results returned by {@link searchHome}. Large enough for
 * a whole provincial race (20) and most party slates; the listbox scrolls.
 */
export const HOME_SEARCH_RESULT_CAP = 20;

/**
 * Lima Metropolitana is the headline race, so its matches always rank first:
 * a provincial candidate outranks an incidental surname match elsewhere.
 */
const PROVINCIAL_BOOST = 50;

/** A candidate whose district name contains a query token as a whole word. */
const DISTRICT_WORD_BOOST = 15;

/** A candidate whose district name is exactly the query ("miraflores", not "san juan de miraflores"). */
const DISTRICT_EXACT_BOOST = 30;

export interface HomeSearchEntry {
  type: "candidate" | "district";
  /** Stable key for list rendering / `aria-activedescendant`. */
  id: string;
  /** Primary line shown in the result (candidate name or district name). */
  label: string;
  /** Secondary line shown under the label (district for a candidate, a short tag for a district). */
  sublabel: string;
  href: string;
  /** Precomputed, normalized haystack used for matching. Not rendered. */
  searchText: string;
  /** Normalized label alone, used for exact/prefix scoring. */
  labelNormalized: string;
  /** True for the Lima Metropolitana district and its candidates. */
  provincial: boolean;
  /** Normalized district name words, for whole-word district matches. */
  districtWords: string[];
  /** Normalized district name, for exact district matches; empty for district entries. */
  districtNormalized: string;
}

/** Display name for a candidate's ámbito (district name, or the provincial label). */
function ambitoDisplayName(ambito: string): string {
  if (ambito === AMBITO_PROVINCIAL) return "Lima Metropolitana";
  return DISTRITO_BY_SLUG.get(ambito)?.nombre ?? ambito;
}

/**
 * Route for an ámbito's listing page. Lima Metropolitana has no
 * `/alcaldes/distrito/*` page of its own — its candidates are listed at the
 * top of `/alcaldes` — so it gets its own href; every other district
 * (including Lima Cercado, which explains it votes provincially) uses the
 * `/alcaldes/distrito/<slug>` route.
 */
function districtHref(slug: string): string {
  if (slug === AMBITO_PROVINCIAL) return "/alcaldes";
  return `/alcaldes/distrito/${slug}`;
}

function buildCandidateEntry(candidato: CandidatoMunicipal): HomeSearchEntry {
  const distrito = ambitoDisplayName(candidato.ambito);
  const searchText = normalize(`${candidato.nombre} ${candidato.partido} ${distrito}`);
  return {
    type: "candidate",
    id: `candidate:${candidato.slug}`,
    label: candidato.nombre,
    // Party is shown so a party query visibly explains why a candidate matched.
    sublabel: candidato.partido ? `${distrito} · ${candidato.partido}` : distrito,
    href: `/alcaldes/${candidato.slug}`,
    searchText,
    labelNormalized: normalize(candidato.nombre),
    provincial: candidato.ambito === AMBITO_PROVINCIAL,
    districtWords: normalize(distrito).split(/\s+/).filter(Boolean),
    districtNormalized: normalize(distrito),
  };
}

function buildDistrictEntry(slug: string, nombre: string): HomeSearchEntry {
  const sublabel = slug === AMBITO_PROVINCIAL ? "Alcaldía provincial" : "Alcaldía distrital";
  return {
    type: "district",
    id: `district:${slug}`,
    label: nombre,
    sublabel,
    href: districtHref(slug),
    searchText: normalize(`${nombre} ${sublabel} distrito municipalidad`),
    labelNormalized: normalize(nombre),
    provincial: slug === AMBITO_PROVINCIAL,
    // A district entry is its own district, so it shares the district-word boost and
    // keeps ranking above the candidates it contains.
    districtWords: normalize(nombre).split(/\s+/).filter(Boolean),
    districtNormalized: "",
  };
}

let cachedIndex: HomeSearchEntry[] | null = null;

/**
 * Builds the static search index once (roster + districts don't change at
 * runtime) and reuses it on every call.
 */
export function buildHomeSearchIndex(): HomeSearchEntry[] {
  if (cachedIndex) return cachedIndex;

  const candidateEntries = CANDIDATOS_MUNICIPALES.map(buildCandidateEntry);
  const districtEntries = [
    buildDistrictEntry(AMBITO_PROVINCIAL, "Lima Metropolitana"),
    ...DISTRITOS_LIMA.map((d) => buildDistrictEntry(d.slug, d.nombre)),
  ];

  cachedIndex = [...candidateEntries, ...districtEntries];
  return cachedIndex;
}

/** Does `token` occur at the start of any whitespace-separated word in `text`? */
function hasWordStartingWith(text: string, token: string): boolean {
  return text.split(/\s+/).some((word) => word.startsWith(token));
}

/**
 * Scores an entry against one normalized query token. Returns 0 when the
 * token doesn't occur anywhere in the entry, so callers can tell "no match"
 * from "weak match".
 */
function scoreToken(entry: HomeSearchEntry, token: string): number {
  if (hasWordStartingWith(entry.labelNormalized, token)) return 20;
  if (entry.labelNormalized.includes(token)) return 8;
  if (hasWordStartingWith(entry.searchText, token)) return 10;
  if (entry.searchText.includes(token)) return 3;
  return 0;
}

function scoreEntry(entry: HomeSearchEntry, queryNormalized: string, tokens: string[]): number | null {
  let score = 0;
  if (entry.labelNormalized === queryNormalized) score += 100;
  else if (entry.labelNormalized.startsWith(queryNormalized)) score += 60;

  for (const token of tokens) {
    const tokenScore = scoreToken(entry, token);
    if (tokenScore === 0) return null; // every query token must match (AND semantics)
    score += tokenScore;
    if (entry.districtWords.includes(token)) score += DISTRICT_WORD_BOOST;
  }
  if (entry.districtNormalized && entry.districtNormalized === queryNormalized) score += DISTRICT_EXACT_BOOST;
  if (entry.provincial) score += PROVINCIAL_BOOST;
  return score;
}

export interface HomeSearchResult {
  entry: HomeSearchEntry;
  score: number;
}

export interface HomeSearchOutcome {
  results: HomeSearchResult[];
  /** Total matches before the cap, so the UI can say how many were left out. */
  total: number;
}

/**
 * Multi-token, accent- and case-insensitive search over candidates and
 * districts. Every token in the query must match somewhere in an entry
 * (name, party or district) for it to be included; results are ranked with
 * exact/prefix matches first and capped at {@link HOME_SEARCH_RESULT_CAP}.
 */
export function searchHome(query: string, index: HomeSearchEntry[] = buildHomeSearchIndex()): HomeSearchResult[] {
  return searchHomeWithTotal(query, index).results;
}

/** Same as {@link searchHome}, plus the uncapped match count. */
export function searchHomeWithTotal(
  query: string,
  index: HomeSearchEntry[] = buildHomeSearchIndex(),
): HomeSearchOutcome {
  const queryNormalized = normalize(query).trim();
  if (!queryNormalized) return { results: [], total: 0 };

  const tokens = queryNormalized.split(/\s+/).filter(Boolean);

  const results: HomeSearchResult[] = [];
  for (const entry of index) {
    const score = scoreEntry(entry, queryNormalized, tokens);
    if (score !== null) results.push({ entry, score });
  }

  results.sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label, "es-PE"));
  return { results: results.slice(0, HOME_SEARCH_RESULT_CAP), total: results.length };
}
