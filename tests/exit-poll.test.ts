import assert from "node:assert/strict";
import test from "node:test";
import { buildExitPollView, exitPollStandingFor, EXIT_POLL_SOURCES, type ExitPollSource } from "../src/lib/exit-poll";
import { AMBITO_PROVINCIAL, candidatosPorAmbito } from "../src/lib/municipales";

const roll = candidatosPorAmbito(AMBITO_PROVINCIAL);

test("ships with no published exit poll so the home page stays in its normal mode", () => {
  assert.equal(buildExitPollView(EXIT_POLL_SOURCES, roll).length, 0);
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
