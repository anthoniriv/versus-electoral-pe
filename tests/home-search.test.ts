import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHomeSearchIndex,
  HOME_SEARCH_RESULT_CAP,
  searchHome,
  searchHomeWithTotal,
} from "../src/lib/home-search";
import { CANDIDATOS_MUNICIPALES } from "../src/lib/municipales";

const index = buildHomeSearchIndex();

function labels(query: string): string[] {
  return searchHome(query, index).map((r) => r.entry.label);
}

test("index includes every roster candidate and every district plus the provincial ámbito", () => {
  assert.equal(
    index.filter((e) => e.type === "candidate").length,
    CANDIDATOS_MUNICIPALES.length,
  );
  // 43 districts (incl. Lima Cercado) + Lima Metropolitana itself.
  assert.equal(index.filter((e) => e.type === "district").length, 44);
});

test("matches are accent- and case-insensitive", () => {
  const candidate = CANDIDATOS_MUNICIPALES.find((c) => c.nombre.includes("Muñoz Soldevilla"));
  assert.ok(candidate, "fixture candidate should exist in the roster");
  assert.ok(labels("munoz soldevilla").includes(candidate!.nombre));
  assert.ok(labels("MUNOZ SOLDEVILLA").includes(candidate!.nombre));
  assert.ok(labels("Muñoz Soldevilla").includes(candidate!.nombre));
});

test("multi-token query requires every token to match (AND semantics)", () => {
  const candidate = CANDIDATOS_MUNICIPALES.find((c) => c.nombre.includes("Ari Acuña"));
  assert.ok(candidate, "fixture candidate should exist in the roster");
  const results = searchHome("roxana acuna", index);
  assert.ok(results.some((r) => r.entry.label === candidate!.nombre));
  // A token that matches nothing should exclude every candidate.
  assert.deepEqual(searchHome("roxana zzzznotarealword", index), []);
});

test("district search resolves Lima Metropolitana to /alcaldes", () => {
  const results = searchHome("lima metropolitana", index);
  const entry = results.find((r) => r.entry.type === "district");
  assert.ok(entry);
  assert.equal(entry!.entry.href, "/alcaldes");
});

test("Lima Cercado keeps its own distrito route, explaining it votes provincially", () => {
  const results = searchHome("cercado", index);
  const entry = results.find((r) => r.entry.label.includes("Cercado"));
  assert.ok(entry);
  assert.equal(entry!.entry.href, "/alcaldes/distrito/lima-cercado");
});

test("district search matches a normal district by name", () => {
  const results = searchHome("surco", index);
  const surco = results.find((r) => r.entry.label === "Santiago de Surco");
  assert.ok(surco);
  assert.equal(surco!.entry.href, "/alcaldes/distrito/santiago-de-surco");
});

test("candidate href points at the profile page", () => {
  const results = searchHome("acuna", index);
  const candidate = results.find((r) => r.entry.type === "candidate");
  assert.ok(candidate);
  assert.match(candidate!.entry.href, /^\/alcaldes\/[a-z0-9-]+$/);
});

test("candidate results show their district and party as the sublabel", () => {
  const candidato = CANDIDATOS_MUNICIPALES.find((c) => c.ambito === "santiago-de-surco" && c.partido);
  assert.ok(candidato);
  const results = searchHome(candidato!.nombre, index);
  const match = results.find((r) => r.entry.label === candidato!.nombre);
  assert.ok(match);
  assert.equal(match!.entry.sublabel, `Santiago de Surco · ${candidato!.partido}`);
});

test("a party name finds that party's candidates", () => {
  const candidato = CANDIDATOS_MUNICIPALES.find((c) => c.ambito === "miraflores" && c.partido);
  assert.ok(candidato);
  const results = searchHome(`${candidato!.partido} miraflores`, index);
  assert.ok(results.some((r) => r.entry.label === candidato!.nombre));
  for (const r of results) {
    assert.equal(r.entry.type, "candidate");
    assert.ok(r.entry.sublabel.includes(candidato!.partido));
  }
});

test("exact and prefix matches rank above substring-only matches", () => {
  const results = searchHome("surco", index);
  // "Santiago de Surco" (word-start match) should outrank any entry that
  // only contains "surco" as a mid-string substring, if one exists at all.
  const topLabel = results[0]?.entry.label;
  assert.equal(topLabel, "Santiago de Surco");
});

test("results are capped", () => {
  // A single, very common token should still be capped.
  const results = searchHome("a", index);
  assert.ok(results.length <= HOME_SEARCH_RESULT_CAP);
});

test("empty or whitespace-only query returns no results", () => {
  assert.deepEqual(searchHome("", index), []);
  assert.deepEqual(searchHome("   ", index), []);
});

test("Lima Metropolitana matches always rank first", () => {
  const results = searchHome("avanza pais", index);
  assert.equal(results[0]?.entry.sublabel.startsWith("Lima Metropolitana"), true);

  const lima = searchHome("lima", index);
  assert.equal(lima[0]?.entry.label, "Lima Metropolitana");
  // Provincial candidates outrank surnames that merely start with "lima".
  const firstSurnameMatch = lima.findIndex((r) => !r.entry.sublabel.startsWith("Lima") && r.entry.type === "candidate");
  const lastProvincial = lima.map((r) => r.entry.sublabel.startsWith("Lima Metropolitana ·")).lastIndexOf(true);
  assert.ok(firstSurnameMatch === -1 || firstSurnameMatch > lastProvincial);
});

test("an exact district query ranks its own candidates above similarly named districts", () => {
  const results = searchHome("miraflores", index).filter((r) => r.entry.type === "candidate");
  assert.ok(results.length > 0);
  assert.ok(results[0].entry.sublabel.startsWith("Miraflores ·"));
});

test("searchHomeWithTotal reports matches left out by the cap", () => {
  const { results, total } = searchHomeWithTotal("avanza pais", index);
  assert.equal(results.length, HOME_SEARCH_RESULT_CAP);
  assert.ok(total > results.length);
});
