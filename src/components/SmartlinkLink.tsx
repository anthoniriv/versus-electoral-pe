"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { claimSmartlinkOpening, SMARTLINK_URL } from "@/lib/smartlink";

/**
 * A session cookie (no Expires/Max-Age) is shared by every tab and cleared when
 * the browser closes, which is exactly "once per browser session".
 * sessionStorage would reset in each new tab.
 */
const sessionCookie = {
  getItem(key: string): string | null {
    const match = document.cookie.split("; ").find((pair) => pair.startsWith(`${key}=`));
    return match ? match.slice(key.length + 1) : null;
  },
  setItem(key: string, value: string): void {
    document.cookie = `${key}=${value}; path=/; SameSite=Lax`;
  },
};

/**
 * Opens the ad Smartlink in a new tab the first time it is called in a browser
 * session. Call it only from a user gesture (click or key press) so the browser
 * allows the new tab.
 */
export function openSmartlinkOnce(): void {
  if (claimSmartlinkOpening(sessionCookie)) {
    window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer");
  }
}

/**
 * A normal internal link that, on the first click of the session, also opens
 * the ad Smartlink in a new tab. The visitor's own navigation is never blocked
 * or redirected.
 */
export function SmartlinkLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        // Ignore modified clicks (new tab, etc.): the visitor chose where to go.
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        openSmartlinkOnce();
      }}
    />
  );
}
