"use client";

import { useEffect, useState } from "react";
import { describeTimeUntilOpen, getCountdownState, type CountdownState } from "@/lib/election-countdown";

/**
 * Relative reminder of ERM 2026 polling day ("Votamos el domingo 4 de octubre,
 * en 1 día y 10 horas"). Pages are statically cached, so the relative part is
 * computed on the client only; the first render shows the date alone to avoid
 * a hydration mismatch.
 */
export function ElectionCountdownText({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<CountdownState | null>(null);

  useEffect(() => {
    const tick = () => setState(getCountdownState(Date.now()));
    tick();
    // Minute precision is enough for a soft reminder; no ticking seconds.
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <>{message(state, compact)}</>;
}

function message(state: CountdownState | null, compact: boolean): string {
  const day = compact ? "el domingo 4" : "el domingo 4 de octubre";
  if (state?.phase === "voting") return "Hoy votamos · las mesas cierran a las 17:00";
  if (state?.phase === "closed") return `La votación del domingo 4 de octubre ya cerró`;
  if (state?.phase === "before") return `Votamos ${day}, ${describeTimeUntilOpen(state)}`;
  return `Votamos ${day}`;
}
