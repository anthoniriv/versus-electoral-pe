import assert from "node:assert/strict";
import test from "node:test";
import { describeTimeUntilOpen, getCountdownState, POLLS_CLOSE, POLLS_OPEN } from "../src/lib/election-countdown";

test("polls open at 7:00 and close at 17:00 Peru time on 2026-10-04", () => {
  assert.equal(new Date(POLLS_OPEN).toISOString(), "2026-10-04T12:00:00.000Z");
  assert.equal(new Date(POLLS_CLOSE).toISOString(), "2026-10-04T22:00:00.000Z");
});

test("before the polls open it breaks the remaining time into units", () => {
  const now = POLLS_OPEN - ((1 * 86_400 + 2 * 3600 + 3 * 60 + 4) * 1000);
  assert.deepEqual(getCountdownState(now), { phase: "before", days: 1, hours: 2, minutes: 3, seconds: 4 });
});

test("during polling hours it reports minutes until close", () => {
  assert.deepEqual(getCountdownState(POLLS_OPEN), { phase: "voting", minutesToClose: 600 });
  assert.deepEqual(getCountdownState(POLLS_CLOSE - 30_000), { phase: "voting", minutesToClose: 1 });
});

test("from closing time on it reports the vote as closed", () => {
  assert.deepEqual(getCountdownState(POLLS_CLOSE), { phase: "closed" });
});

test("the soft description uses at most two units and Spanish plurals", () => {
  const before = (d: number, h: number, m: number) =>
    ({ phase: "before", days: d, hours: h, minutes: m, seconds: 0 }) as const;
  assert.equal(describeTimeUntilOpen(before(1, 10, 29)), "en 1 día y 10 horas");
  assert.equal(describeTimeUntilOpen(before(2, 1, 0)), "en 2 días y 1 hora");
  assert.equal(describeTimeUntilOpen(before(3, 0, 5)), "en 3 días");
  assert.equal(describeTimeUntilOpen(before(0, 4, 12)), "en 4 horas y 12 min");
  assert.equal(describeTimeUntilOpen(before(0, 0, 7)), "en 7 min");
  assert.equal(describeTimeUntilOpen(before(0, 0, 0)), "en menos de un minuto");
});
