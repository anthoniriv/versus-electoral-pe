/** Adsterra Smartlink opened in a new tab on selected clicks, at most once per session. */
export const SMARTLINK_URL =
  "https://www.profitableratecpmnetwork.com/d13bqexun?key=eb5faa6a6410026a27841e2c397e0ded";

export const SMARTLINK_SESSION_KEY = "smartlink-opened";

interface SessionLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Fallback when the session store is unavailable (blocked cookies):
// keeps the once-per-session promise for the lifetime of the loaded page.
let openedInMemory = false;

/**
 * Claims the single Smartlink opening for this browser session. Returns true
 * only the first time; every later call in the same session returns false.
 */
export function claimSmartlinkOpening(storage: SessionLike | null): boolean {
  if (openedInMemory) return false;
  try {
    if (storage?.getItem(SMARTLINK_SESSION_KEY)) {
      openedInMemory = true;
      return false;
    }
    storage?.setItem(SMARTLINK_SESSION_KEY, "1");
  } catch {
    // Storage threw: fall through to the in-memory flag only.
  }
  openedInMemory = true;
  return true;
}

/** Test helper: forget the in-memory flag. */
export function resetSmartlinkMemoryForTests(): void {
  openedInMemory = false;
}
