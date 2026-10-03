import { NextResponse } from "next/server";
import { getSiteVisitors } from "@/lib/site-visitors";

// Public counters only. The CDN caches the answer for 30 minutes, so GA4 is
// queried at most a couple of times per half hour regardless of traffic.
const CACHE = "public, s-maxage=1800, stale-while-revalidate=600";

export const dynamic = "force-dynamic";

export async function GET() {
  const visitors = await getSiteVisitors();
  if (!visitors) {
    // Short cache on failure so a transient GA outage recovers quickly.
    return NextResponse.json(null, { headers: { "Cache-Control": "public, s-maxage=300" } });
  }
  return NextResponse.json(visitors, { headers: { "Cache-Control": CACHE } });
}
