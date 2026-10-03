import {
  matchesSuggestedCandidate,
  type CandidateIdentity,
} from "./news-attribution";

export const NEWS_OWNERSHIP_VERDICTS = [
  "BELONGS",
  "DOES_NOT_BELONG",
  "UNCERTAIN",
] as const;

export type NewsOwnershipVerdict = (typeof NEWS_OWNERSHIP_VERDICTS)[number];

export interface NewsOwnershipCandidate extends CandidateIdentity {
  partido?: string | null;
  cargo?: string | null;
}

export interface NewsOwnershipArticle {
  titulo: string;
  resumen?: string | null;
  fuente?: string | null;
  fechaNoticia?: string | Date | null;
  url?: string | null;
}

export interface NewsOwnershipEvidence {
  candidate: {
    name: string;
    aliases: string[];
    party?: string;
    office?: string;
  };
  news: {
    headline: string;
    summary?: string;
    source?: string;
    publishedAt?: string;
  };
  deterministic: {
    suggestedCandidateMatch: boolean;
  };
}

export interface TypeSafeSystemOneRequest {
  model: string;
  state: NewsOwnershipEvidence;
  questions: {
    ownership: {
      type: "choice";
      instructions: string;
      criteria: Record<NewsOwnershipVerdict, string>;
    };
  };
}

export interface NewsOwnershipResult {
  verdict: NewsOwnershipVerdict;
  confidence: number;
  probabilities: Record<NewsOwnershipVerdict, number>;
  model: string;
  provider?: string;
  requestId?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type JevFailureCode =
  | "CONFIGURATION"
  | "NETWORK"
  | "HTTP"
  | "INVALID_RESPONSE";

export class JevError extends Error {
  constructor(
    public readonly code: JevFailureCode,
    message: string,
    public readonly status?: number,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "JevError";
  }
}

export interface JevHttpErrorDetails {
  status: number;
  transient: boolean;
  upstreamStatus?: number;
  retryAfterMs?: number;
}

const SAFE_ERROR_MESSAGE_LIMIT = 240;
const MAX_RETRY_AFTER_MS = 30_000;

export function sanitizeJevErrorMessage(value: unknown, secret?: string): string | undefined {
  if (typeof value !== "string") return undefined;
  let message = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!message) return undefined;
  if (secret) message = message.split(secret).join("[redacted]");
  message = message
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/\b(api[_-]?key|authorization|token|secret)\s*[:=]\s*["']?[^\s,"'}]+/gi, "$1=[redacted]");
  return message.slice(0, SAFE_ERROR_MESSAGE_LIMIT);
}

function extractTypeSafeErrorMessage(payload: unknown, secret: string): string | undefined {
  if (!isObject(payload)) return undefined;
  const directMessage = sanitizeJevErrorMessage(payload.message, secret);
  if (directMessage) return directMessage;
  if (typeof payload.detail === "string") return sanitizeJevErrorMessage(payload.detail, secret);
  if (!Array.isArray(payload.detail)) return undefined;

  const validationMessages = payload.detail.flatMap((detail) => {
    if (!isObject(detail)) return [];
    const message = sanitizeJevErrorMessage(detail.msg, secret);
    if (!message) return [];
    const location = Array.isArray(detail.loc)
      ? detail.loc.filter((part) => typeof part === "string" || typeof part === "number").join(".")
      : "";
    return [location ? `${location}: ${message}` : message];
  });
  return sanitizeJevErrorMessage(validationMessages.join("; "), secret);
}

export function parseRetryAfterMs(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(value) - now;
  if (!Number.isFinite(delay) || delay < 0) return undefined;
  return Math.min(Math.ceil(delay), MAX_RETRY_AFTER_MS);
}

export function describeJevHttpError(error: JevError): JevHttpErrorDetails {
  const upstreamStatus = error.status;
  if (error.code === "CONFIGURATION") return { status: 503, transient: false };
  if (error.code === "NETWORK") return { status: 503, transient: true };
  if (error.code === "INVALID_RESPONSE") return { status: 502, transient: false };
  if (upstreamStatus === 401 || upstreamStatus === 403) {
    return { status: 503, transient: false, upstreamStatus };
  }
  if (upstreamStatus === 429) {
    return { status: 429, transient: true, upstreamStatus, retryAfterMs: error.retryAfterMs };
  }
  if (upstreamStatus && upstreamStatus >= 500) {
    return { status: 503, transient: true, upstreamStatus, retryAfterMs: error.retryAfterMs };
  }
  return { status: 502, transient: false, ...(upstreamStatus ? { upstreamStatus } : {}) };
}

const OWNERSHIP_CRITERIA: Record<NewsOwnershipVerdict, string> = {
  BELONGS: "The article is about, quotes, or materially concerns the assigned candidate.",
  DOES_NOT_BELONG: "The article concerns a different person or has no material connection to the assigned candidate.",
  UNCERTAIN: "The supplied evidence is insufficient or ambiguous; human review is required.",
};

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildNewsOwnershipEvidence(
  candidate: NewsOwnershipCandidate,
  article: NewsOwnershipArticle,
): NewsOwnershipEvidence {
  const headline = article.titulo.trim();
  const summary = optionalText(article.resumen);
  const attributionText = [headline, summary].filter(Boolean).join("\n");
  const publishedAt = article.fechaNoticia instanceof Date
    ? article.fechaNoticia.toISOString()
    : optionalText(article.fechaNoticia);

  return {
    candidate: {
      name: candidate.nombre.trim(),
      aliases: candidate.keywords.map((keyword) => keyword.trim()).filter(Boolean),
      ...(optionalText(candidate.partido) ? { party: optionalText(candidate.partido) } : {}),
      ...(optionalText(candidate.cargo) ? { office: optionalText(candidate.cargo) } : {}),
    },
    news: {
      headline,
      ...(summary ? { summary } : {}),
      ...(optionalText(article.fuente) ? { source: optionalText(article.fuente) } : {}),
      ...(publishedAt ? { publishedAt } : {}),
    },
    deterministic: {
      suggestedCandidateMatch: matchesSuggestedCandidate(attributionText, candidate),
    },
  };
}

export function buildTypeSafeOwnershipRequest(
  evidence: NewsOwnershipEvidence,
  model = "jev-latest",
): TypeSafeSystemOneRequest {
  return {
    model,
    state: evidence,
    questions: {
      ownership: {
        type: "choice",
        instructions: "Decide whether the news item belongs to the assigned candidate using only the supplied evidence. Prefer UNCERTAIN when identity is ambiguous.",
        criteria: OWNERSHIP_CRITERIA,
      },
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function invalidResponse(): never {
  throw new JevError("INVALID_RESPONSE", "TypeSafe returned an invalid ownership response.");
}

export function parseTypeSafeOwnershipResponse(payload: unknown): NewsOwnershipResult {
  if (!isObject(payload) || typeof payload.model !== "string" || !payload.model.trim() || !isObject(payload.answers)) {
    invalidResponse();
  }
  const answer = payload.answers.ownership;
  if (!isObject(answer) || answer.type !== "choice") invalidResponse();
  if (!NEWS_OWNERSHIP_VERDICTS.includes(answer.choice as NewsOwnershipVerdict)) invalidResponse();
  if (!boundedNumber(answer.confidence) || !isObject(answer.probabilities)) invalidResponse();

  const probabilityPayload = answer.probabilities;
  const probabilities = Object.fromEntries(
    NEWS_OWNERSHIP_VERDICTS.map((verdict) => [verdict, probabilityPayload[verdict]]),
  ) as Record<NewsOwnershipVerdict, unknown>;
  if (!NEWS_OWNERSHIP_VERDICTS.every((verdict) => boundedNumber(probabilities[verdict]))) invalidResponse();
  const total = NEWS_OWNERSHIP_VERDICTS.reduce((sum, verdict) => sum + (probabilities[verdict] as number), 0);
  if (Math.abs(total - 1) > 0.02) invalidResponse();

  if (!isObject(payload.usage)
    || !Number.isInteger(payload.usage.input_tokens)
    || (payload.usage.input_tokens as number) < 0
    || !Number.isInteger(payload.usage.output_tokens)
    || (payload.usage.output_tokens as number) < 0) invalidResponse();
  const usage: NonNullable<NewsOwnershipResult["usage"]> = {
    inputTokens: payload.usage.input_tokens as number,
    outputTokens: payload.usage.output_tokens as number,
  };

  return {
    verdict: answer.choice as NewsOwnershipVerdict,
    confidence: answer.confidence,
    probabilities: probabilities as Record<NewsOwnershipVerdict, number>,
    model: payload.model,
    provider: "TypeSafe",
    usage,
  };
}

export interface TypeSafeJevClientOptions {
  fetch?: typeof fetch;
  signal?: AbortSignal;
  baseUrl?: string;
}

export async function evaluateNewsOwnership(
  evidence: NewsOwnershipEvidence,
  options: TypeSafeJevClientOptions = {},
): Promise<NewsOwnershipResult> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) throw new JevError("CONFIGURATION", "TYPESAFE_API_KEY is not configured.");
  const model = process.env.TYPESAFE_JEV_MODEL?.trim() || "jev-latest";
  const baseUrl = options.baseUrl ?? process.env.TYPESAFE_BASE_URL?.trim() ?? "https://api.typesafe.ai";

  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(
      `${baseUrl.replace(/\/$/, "")}/v1/systemone`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildTypeSafeOwnershipRequest(evidence, model)),
        signal: options.signal,
      },
    );
  } catch {
    throw new JevError("NETWORK", "TypeSafe could not be reached.");
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    const message = extractTypeSafeErrorMessage(payload, apiKey);
    throw new JevError(
      "HTTP",
      message ?? "TypeSafe rejected the ownership request.",
      response.status,
      parseRetryAfterMs(response.headers.get("Retry-After")),
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    invalidResponse();
  }
  return parseTypeSafeOwnershipResponse(payload);
}
