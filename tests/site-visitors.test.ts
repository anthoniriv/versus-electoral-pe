import assert from "node:assert/strict";
import test from "node:test";
import { firstMetric, getSiteVisitors } from "../src/lib/site-visitors";

test("firstMetric reads the first value and treats a missing row as zero", () => {
  assert.equal(firstMetric({ rows: [{ metricValues: [{ value: "254" }] }] }), 254);
  assert.equal(firstMetric({ rows: [] }), 0);
  assert.equal(firstMetric(undefined), 0);
  assert.equal(firstMetric({ rows: [{ metricValues: [{ value: "not-a-number" }] }] }), 0);
});

test("getSiteVisitors returns null instead of throwing when GA4 is not configured", async () => {
  const saved = { ...process.env };
  delete process.env.GA4_PROPERTY_ID;
  assert.equal(await getSiteVisitors(), null);
  process.env.GA4_PROPERTY_ID = "1";
  delete process.env.GA4_SERVICE_ACCOUNT_JSON;
  delete process.env.GA4_KEY_FILE;
  assert.equal(await getSiteVisitors(), null);
  process.env = saved;
});
