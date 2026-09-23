export interface CandidateIdentity {
  nombre: string;
  keywords: string[];
}

const NAME_CONNECTORS = new Set(["de", "del", "la", "las", "los", "y"]);
const NON_NAME_PREFIXES = new Set([
  "alcalde",
  "alcaldesa",
  "candidato",
  "candidata",
  "congresista",
  "exalcalde",
  "exalcaldesa",
  "fiscal",
  "regidor",
  "regidora",
  "señor",
  "señora",
]);

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizedTokens(value: string): string[] {
  return normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
}

function tokenizedText(value: string): Array<{ normalized: string; proper: boolean }> {
  return [...value.matchAll(/[\p{L}\p{N}]+/gu)].map(([raw]) => ({
    normalized: normalize(raw),
    proper: /^\p{Lu}/u.test(raw),
  }));
}

function includesSequence(tokens: string[], sequence: string[]): number[] {
  const starts: number[] = [];
  for (let index = 0; index <= tokens.length - sequence.length; index++) {
    if (sequence.every((token, offset) => tokens[index + offset] === token)) {
      starts.push(index);
    }
  }
  return starts;
}

function hasConflictingNameBeforeSurnameAlias(
  text: string,
  candidate: CandidateIdentity,
): boolean {
  const surnameAlias = normalizedTokens(candidate.keywords[0] ?? "");
  if (surnameAlias.length < 2) return false;

  const candidateTokens = new Set(
    normalizedTokens(candidate.nombre).filter((token) => !NAME_CONNECTORS.has(token)),
  );
  const textTokens = tokenizedText(text);
  const starts = includesSequence(
    textTokens.map((token) => token.normalized),
    surnameAlias,
  );

  return starts.some((start) => {
    const previous = textTokens[start - 1];
    return previous?.proper
      && !candidateTokens.has(previous.normalized)
      && !NON_NAME_PREFIXES.has(previous.normalized);
  });
}

export function matchesSuggestedCandidate(
  text: string,
  candidate: CandidateIdentity,
): boolean {
  if (hasConflictingNameBeforeSurnameAlias(text, candidate)) return false;

  const normalizedText = normalize(text);
  if (candidate.keywords.some((keyword) => normalizedText.includes(normalize(keyword)))) {
    return true;
  }

  const candidateTokens = [...new Set(
    normalizedTokens(candidate.nombre)
      .filter((token) => token.length >= 4 && !NAME_CONNECTORS.has(token)),
  )];
  return candidateTokens.filter((token) => normalizedText.includes(token)).length >= 2;
}

function matchesCandidateKeyword(text: string, candidate: CandidateIdentity): boolean {
  const normalizedText = normalize(text);
  return candidate.keywords.some((keyword) => normalizedText.includes(normalize(keyword)));
}

export function resolveCandidateAttribution<T extends CandidateIdentity>(
  text: string,
  suggested: T | null,
  candidates: T[],
): T | null {
  if (suggested) {
    return matchesSuggestedCandidate(text, suggested) ? suggested : null;
  }
  return candidates.find((candidate) => matchesCandidateKeyword(text, candidate)) ?? null;
}
