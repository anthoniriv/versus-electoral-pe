import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesSuggestedCandidate,
  resolveCandidateAttribution,
  type CandidateIdentity,
} from "../src/lib/news-attribution";

const aldo: CandidateIdentity = {
  nombre: "Aldo Horacio Rosales Pacheco",
  keywords: [
    "Rosales Pacheco",
    "Aldo Rosales",
    "Aldo Horacio Rosales",
    "Aldo Horacio Rosales Pacheco",
  ],
};

test("rejects Joel Rosales Pacheco for Aldo Rosales Pacheco", () => {
  const headline = "Alcalde de Marcona, Joel Rosales Pacheco, es condenado por delito de corrupción";

  assert.equal(matchesSuggestedCandidate(headline, aldo), false);
  assert.equal(resolveCandidateAttribution(headline, aldo, [aldo]), null);
});

test("accepts Aldo Rosales Pacheco when the candidate identity is present", () => {
  const headline = "Aldo Rosales Pacheco presenta su candidatura en La Victoria";

  assert.equal(matchesSuggestedCandidate(headline, aldo), true);
  assert.equal(resolveCandidateAttribution(headline, aldo, [aldo]), aldo);
});

test("preserves a valid two-component media name", () => {
  const rosselli: CandidateIdentity = {
    nombre: "Yessica Rosselli Amuruz Dulanto",
    keywords: [
      "Amuruz Dulanto",
      "Yessica Amuruz",
      "Yessica Rosselli Amuruz",
      "Yessica Rosselli Amuruz Dulanto",
    ],
  };

  assert.equal(
    matchesSuggestedCandidate("Rosselli Amuruz postulará a la alcaldía", rosselli),
    true,
  );
});

test("keeps broad keyword matching only for unscoped news", () => {
  assert.equal(
    resolveCandidateAttribution("Investigación menciona a Rosales Pacheco", null, [aldo]),
    aldo,
  );
});
