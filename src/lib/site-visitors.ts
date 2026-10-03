// Server-side only: imported from the /api/visitantes route, never from client code.
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface SiteVisitors {
  /** Active users in the last 30 minutes (GA4 realtime). */
  activeNow: number;
  /** Users so far today, in the GA4 property's time zone. */
  visitorsToday: number;
}

interface MetricReport {
  rows?: Array<{ metricValues?: Array<{ value?: string | null }> | null }> | null;
}

/** Reads the first metric of the first row; GA omits rows when the value is zero. */
export function firstMetric(report: MetricReport | undefined): number {
  const value = Number(report?.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Service-account credentials, server-side only. On Vercel set
 * GA4_SERVICE_ACCOUNT_JSON to the key file's JSON; locally GA4_KEY_FILE can
 * point at the file instead. Returns null when nothing is configured.
 */
function createClient(): BetaAnalyticsDataClient | null {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (json) {
    const { client_email, private_key } = JSON.parse(json) as { client_email: string; private_key: string };
    return new BetaAnalyticsDataClient({ credentials: { client_email, private_key }, fallback: "rest" });
  }
  if (process.env.GA4_KEY_FILE) {
    return new BetaAnalyticsDataClient({ keyFilename: process.env.GA4_KEY_FILE, fallback: "rest" });
  }
  return null;
}

/** Public visitor counters for the footer. Never throws; returns null when unavailable. */
export async function getSiteVisitors(): Promise<SiteVisitors | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return null;

  try {
    const client = createClient();
    if (!client) return null;
    const property = `properties/${propertyId}`;
    const [[realtime], [today]] = await Promise.all([
      client.runRealtimeReport({ property, metrics: [{ name: "activeUsers" }] }),
      client.runReport({
        property,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
    ]);
    return { activeNow: firstMetric(realtime), visitorsToday: firstMetric(today) };
  } catch (error) {
    console.error("[VISITORS] Could not read GA4 counters:", error instanceof Error ? error.message : error);
    return null;
  }
}
