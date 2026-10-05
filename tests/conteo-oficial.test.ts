import assert from "node:assert/strict";
import test from "node:test";
import { buildConteoOficialView, conteoStandingFor } from "../src/lib/conteo-oficial";

test("returns no view until ONPE counts votes so the home page does not show the count", () => {
  assert.equal(buildConteoOficialView({}, null), null);
});

test("carries counted and total actas and valid votes into the view", () => {
  const view = buildConteoOficialView(
    {
      "lima-metropolitana": {
        actasPct: 10,
        actas: { contabilizadas: 100, total: 1000 },
        votosValidos: 5000,
        filas: [{ nombre: "Carlos Bruce", porcentaje: 60, votos: 3000 }],
      },
    },
    null
  );
  const lima = view?.ambitos[0];
  assert.deepEqual(lima?.actas, { contabilizadas: 100, total: 1000 });
  assert.equal(lima?.votosValidos, 5000);
  assert.equal(lima?.filas[0].votos, 3000);
});

test("lists Lima Metropolitana first and every district that elects a mayor, pending ones empty", () => {
  const view = buildConteoOficialView({ ate: { actasPct: 40, filas: [{ nombre: "X", porcentaje: 30 }] } }, "9:00 p. m.");
  assert.ok(view);
  assert.equal(view.ambitos[0].slug, "lima-metropolitana");
  assert.equal(view.ambitos[0].actasPct, null);
  assert.equal(view.ambitos.length, 43);
  assert.ok(!view.ambitos.some((a) => a.slug === "lima-cercado"));
  const ate = view.ambitos.find((a) => a.slug === "ate");
  assert.equal(ate?.actasPct, 40);
  assert.equal(ate?.filas.length, 1);
});

test("matches names only against the ámbito's own roll and reports the standing", () => {
  const view = buildConteoOficialView(
    {
      "lima-metropolitana": {
        actasPct: 55.5,
        filas: [
          { nombre: "Otro", porcentaje: 40 },
          { nombre: "Carlos Tejada", porcentaje: 20 },
        ],
      },
    },
    null
  );
  assert.deepEqual(conteoStandingFor("carlos-alberto-tejada-noriega", view), { puesto: 2, porcentaje: 20, actasPct: 55.5 });
  assert.equal(conteoStandingFor("no-existe", view), null);
});
