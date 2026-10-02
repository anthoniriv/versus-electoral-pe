import assert from "node:assert/strict";
import test from "node:test";
import {
  JevError,
  buildTypeSafeOwnershipRequest,
  buildNewsOwnershipEvidence,
  describeJevHttpError,
  evaluateNewsOwnership,
  parseRetryAfterMs,
  parseTypeSafeOwnershipResponse,
  sanitizeJevErrorMessage,
  type NewsOwnershipCandidate,
} from "../src/lib/news-ownership-audit";

const aldo: NewsOwnershipCandidate = {
  nombre: "Aldo Horacio Rosales Pacheco",
  keywords: [
    "Rosales Pacheco",
    "Aldo Rosales",
    "Aldo Horacio Rosales",
    "Aldo Horacio Rosales Pacheco",
  ],
  partido: "Partido de prueba",
};

test("builds a compact TypeSafe System One request", () => {
  const evidence = buildNewsOwnershipEvidence(aldo, {
    titulo: "Aldo Rosales presenta su candidatura",
    resumen: "El candidato anunció sus propuestas.",
    fuente: "Medio local",
    url: "https://example.test/noticia",
  });

  assert.deepEqual(buildTypeSafeOwnershipRequest(evidence), {
    model: "jev-latest",
    state: evidence,
    questions: {
      ownership: {
        type: "choice",
        instructions: "Decide whether the news item belongs to the assigned candidate using only the supplied evidence. Prefer UNCERTAIN when identity is ambiguous.",
        criteria: {
          BELONGS: "The article is about, quotes, or materially concerns the assigned candidate.",
          DOES_NOT_BELONG: "The article concerns a different person or has no material connection to the assigned candidate.",
          UNCERTAIN: "The supplied evidence is insufficient or ambiguous; human review is required.",
        },
      },
    },
  });
  assert.equal(buildTypeSafeOwnershipRequest(evidence, "jev-preview").model, "jev-preview");
  assert.equal("url" in evidence.news, false);
});

test("strictly parses a valid ownership response", () => {
  assert.deepEqual(parseTypeSafeOwnershipResponse({
    model: "typesafe/jev-1.13-20260917",
    answers: {
      ownership: {
        type: "choice",
        choice: "DOES_NOT_BELONG",
        confidence: 0.93,
        probabilities: {
          BELONGS: 0.02,
          DOES_NOT_BELONG: 0.93,
          UNCERTAIN: 0.05,
        },
      },
    },
    usage: { input_tokens: 80, output_tokens: 12 },
  }), {
    verdict: "DOES_NOT_BELONG",
    confidence: 0.93,
    probabilities: {
      BELONGS: 0.02,
      DOES_NOT_BELONG: 0.93,
      UNCERTAIN: 0.05,
    },
    model: "typesafe/jev-1.13-20260917",
    provider: "TypeSafe",
    usage: { inputTokens: 80, outputTokens: 12 },
  });
});

test("rejects malformed or unbounded ownership responses", () => {
  const invalidPayloads = [
    null,
    { model: "jev", answers: {}, usage: { input_tokens: 1, output_tokens: 1 } },
    {
      model: "jev",
      answers: {
        ownership: {
          type: "choice",
          choice: "DELETE",
          confidence: 1,
          probabilities: { BELONGS: 0, DOES_NOT_BELONG: 1, UNCERTAIN: 0 },
        },
      },
      usage: { input_tokens: 1, output_tokens: 1 },
    },
    {
      model: "jev",
      answers: {
        ownership: {
          type: "choice",
          choice: "BELONGS",
          confidence: 1.2,
          probabilities: { BELONGS: 0.8, DOES_NOT_BELONG: 0.1, UNCERTAIN: 0.1 },
        },
      },
      usage: { input_tokens: 1, output_tokens: 1 },
    },
  ];

  for (const payload of invalidPayloads) {
    assert.throws(
      () => parseTypeSafeOwnershipResponse(payload),
      (error: unknown) => error instanceof JevError && error.code === "INVALID_RESPONSE",
    );
  }
});

test("marks Joel Rosales Pacheco as conflicting evidence for Aldo", () => {
  const evidence = buildNewsOwnershipEvidence(aldo, {
    titulo: "Alcalde de Marcona, Joel Rosales Pacheco, es condenado por corrupción",
  });

  assert.equal(evidence.deterministic.suggestedCandidateMatch, false);
});

test("marks Aldo Rosales Pacheco as matching evidence", () => {
  const evidence = buildNewsOwnershipEvidence(aldo, {
    titulo: "Aldo Rosales Pacheco presenta su candidatura en La Victoria",
  });

  assert.equal(evidence.deterministic.suggestedCandidateMatch, true);
});

test("sanitizes and bounds the standard Jev error message", () => {
  const secret = "super-secret-key";
  const message = sanitizeJevErrorMessage(
    `Invalid token=${secret}\nAuthorization: Bearer abc123 ${"x".repeat(300)}`,
    secret,
  );

  assert.ok(message);
  assert.equal(message.includes(secret), false);
  assert.equal(message.includes("abc123"), false);
  assert.ok(message.length <= 240);
  assert.equal(sanitizeJevErrorMessage({ message: "not a string" }), undefined);
});

test("maps Jev failures to safe local statuses and explicit transient semantics", () => {
  assert.deepEqual(describeJevHttpError(new JevError("HTTP", "unauthorized", 401)), {
    status: 503,
    transient: false,
    upstreamStatus: 401,
  });
  assert.deepEqual(describeJevHttpError(new JevError("HTTP", "limited", 429, 2_000)), {
    status: 429,
    transient: true,
    upstreamStatus: 429,
    retryAfterMs: 2_000,
  });
  assert.deepEqual(describeJevHttpError(new JevError("HTTP", "down", 502)), {
    status: 503,
    transient: true,
    upstreamStatus: 502,
    retryAfterMs: undefined,
  });
  assert.deepEqual(describeJevHttpError(new JevError("INVALID_RESPONSE", "invalid")), {
    status: 502,
    transient: false,
  });
  assert.deepEqual(describeJevHttpError(new JevError("NETWORK", "offline")), {
    status: 503,
    transient: true,
  });
});

test("extracts safe TypeSafe validation details and Retry-After without a live request", async () => {
  const previousKey = process.env.TYPESAFE_API_KEY;
  process.env.TYPESAFE_API_KEY = "server-only-secret";
  try {
    await assert.rejects(
      () => evaluateNewsOwnership(buildNewsOwnershipEvidence(aldo, { titulo: "Test" }), {
        fetch: async () => new Response(JSON.stringify({
          detail: [{ loc: ["body", "model"], msg: "Invalid token=server-only-secret", type: "value_error" }],
        }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "2" } }),
      }),
      (error: unknown) => error instanceof JevError
        && error.message === "body.model: Invalid token=[redacted]"
        && error.status === 429
        && error.retryAfterMs === 2_000,
    );
  } finally {
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
  }
});

test("calls the direct TypeSafe System One endpoint with the configured Jev model", async () => {
  const previousKey = process.env.TYPESAFE_API_KEY;
  const previousModel = process.env.TYPESAFE_JEV_MODEL;
  process.env.TYPESAFE_API_KEY = "server-only-secret";
  process.env.TYPESAFE_JEV_MODEL = "jev-preview";
  let request: Request | undefined;
  try {
    const result = await evaluateNewsOwnership(
      buildNewsOwnershipEvidence(aldo, { titulo: "Test" }),
      {
        fetch: async (input, init) => {
          request = new Request(input, init);
          return new Response(JSON.stringify({
            model: "jev-preview",
            answers: {
              ownership: {
                type: "choice",
                choice: "UNCERTAIN",
                confidence: 0.6,
                probabilities: { BELONGS: 0.2, DOES_NOT_BELONG: 0.2, UNCERTAIN: 0.6 },
              },
            },
            usage: { input_tokens: 40, output_tokens: 8 },
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        },
      },
    );

    assert.equal(request?.url, "https://api.typesafe.ai/v1/systemone");
    assert.equal(request?.headers.get("Authorization"), "Bearer server-only-secret");
    assert.equal((await request?.json()).model, "jev-preview");
    assert.equal(result.verdict, "UNCERTAIN");
  } finally {
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.TYPESAFE_JEV_MODEL;
    else process.env.TYPESAFE_JEV_MODEL = previousModel;
  }
});

test("bounds Retry-After values", () => {
  assert.equal(parseRetryAfterMs("2"), 2_000);
  assert.equal(parseRetryAfterMs("999"), 30_000);
  assert.equal(parseRetryAfterMs("invalid"), undefined);
});
