import assert from "node:assert/strict";
import test from "node:test";
import { buildExitPollView, exitPollStandingFor, EXIT_POLL_SOURCES, type ExitPollSource } from "../src/lib/exit-poll";
import { AMBITO_PROVINCIAL, candidatosPorAmbito } from "../src/lib/municipales";

const roll = candidatosPorAmbito(AMBITO_PROVINCIAL);

test("publishes the Datum flash only, matching names against the JNE roll", () => {
  const view = buildExitPollView(EXIT_POLL_SOURCES, roll);
  assert.deepEqual(view.map((s) => s.id), ["datum"]);
  assert.deepEqual(
    view[0].filas.map((f) => [f.nombre, f.slug]),
    [
      ["Rafael López Aliaga", null],
      ["Francis Allison", "francis-james-allison-oyague"],
      ["Carlos Bruce", "carlos-ricardo-bruce-montes-de-oca"],
      ["Daniel Urresti", "daniel-belizario-urresti-elera"],
    ]
  );
  assert.equal(view[0].filas[0].partido, "Renovación Popular");
});

test("sorts by percentage and caps the list at 10 rows", () => {
  const filas = Array.from({ length: 12 }, (_, i) => ({ nombre: `Candidato ${i}`, porcentaje: i }));
  const [view] = buildExitPollView([{ id: "ipsos", nombre: "Ipsos Perú", filas }], roll);
  assert.equal(view.filas.length, 10);
  assert.equal(view.filas[0].porcentaje, 11);
  assert.equal(view.filas[9].porcentaje, 2);
});

test("keeps short lists of 3 rows as published and drops empty sources", () => {
  const sources: ExitPollSource[] = [
    { id: "ipsos", nombre: "Ipsos Perú", filas: [] },
    { id: "datum", nombre: "Datum", filas: [{ nombre: "A", porcentaje: 30 }, { nombre: "B", porcentaje: 20 }, { nombre: "C", porcentaje: 10 }] },
  ];
  const view = buildExitPollView(sources, roll);
  assert.deepEqual(view.map((s) => s.id), ["datum"]);
  assert.equal(view[0].filas.length, 3);
});

test("matches a short published name to the JNE roll for photo and profile link", () => {
  const [view] = buildExitPollView(
    [{ id: "ipsos", nombre: "Ipsos Perú", filas: [{ nombre: "Carlos Tejada", porcentaje: 12.5 }] }],
    roll
  );
  assert.equal(view.filas[0].slug, "carlos-alberto-tejada-noriega");
  assert.equal(view.filas[0].partido, "Acción Popular");
});

test("leaves unknown names unlinked instead of guessing", () => {
  const [view] = buildExitPollView(
    [{ id: "ipsos", nombre: "Ipsos Perú", filas: [{ nombre: "Nadie Inexistente", porcentaje: 1 }] }],
    roll
  );
  assert.equal(view.filas[0].slug, null);
});

test("reports a candidate's standing in each published exit poll", () => {
  const view = buildExitPollView(
    [
      { id: "ipsos", nombre: "Ipsos Perú", filas: [{ nombre: "Otro", porcentaje: 40 }, { nombre: "Carlos Tejada", porcentaje: 12.5 }] },
      { id: "datum", nombre: "Datum", filas: [{ nombre: "Otro", porcentaje: 40 }] },
    ],
    roll
  );
  assert.deepEqual(exitPollStandingFor("carlos-alberto-tejada-noriega", view), [
    { fuente: "Ipsos Perú", puesto: 2, porcentaje: 12.5 },
  ]);
});
