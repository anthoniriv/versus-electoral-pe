import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { claimSmartlinkOpening, resetSmartlinkMemoryForTests, SMARTLINK_SESSION_KEY } from "../src/lib/smartlink";

function memoryStorage() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
}

beforeEach(() => resetSmartlinkMemoryForTests());

test("opens only on the first claim of a session", () => {
  const storage = memoryStorage();
  assert.equal(claimSmartlinkOpening(storage), true);
  assert.equal(storage.map.get(SMARTLINK_SESSION_KEY), "1");
  assert.equal(claimSmartlinkOpening(storage), false);
});

test("respects a flag already stored by an earlier page in the same session", () => {
  const storage = memoryStorage();
  storage.setItem(SMARTLINK_SESSION_KEY, "1");
  assert.equal(claimSmartlinkOpening(storage), false);
});

test("without usable storage it still opens at most once per page load", () => {
  const throwing = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(claimSmartlinkOpening(throwing), true);
  assert.equal(claimSmartlinkOpening(throwing), false);
  resetSmartlinkMemoryForTests();
  assert.equal(claimSmartlinkOpening(null), true);
  assert.equal(claimSmartlinkOpening(null), false);
});
