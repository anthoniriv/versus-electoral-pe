"use client";

import { useEffect, useState } from "react";

interface Visitors {
  activeNow: number;
  visitorsToday: number;
}

/**
 * Public visitor counters from GA4, served by /api/visitantes (CDN-cached for
 * 30 minutes). Renders nothing until data arrives or when it is unavailable.
 */
export function FooterVisitors({ className = "" }: { className?: string }) {
  const [visitors, setVisitors] = useState<Visitors | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/visitantes", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Visitors | null) => {
        if (data && Number.isFinite(data.visitorsToday)) setVisitors(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!visitors) return null;

  const fmt = (n: number) => n.toLocaleString("es-PE");
  return (
    <p className={`text-[11px] text-gray-400 ${className}`}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" aria-hidden="true" />
      {fmt(visitors.visitorsToday)} visitantes hoy · {fmt(visitors.activeNow)} en los últimos 30 min
    </p>
  );
}
