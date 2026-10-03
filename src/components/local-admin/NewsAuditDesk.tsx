"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const VERDICTS = ["BELONGS", "DOES_NOT_BELONG", "UNCERTAIN"] as const;
type Verdict = (typeof VERDICTS)[number];

type Audit = {
  machine?: {
    evidence: { deterministic: { suggestedCandidateMatch: boolean } };
    result: {
      verdict: Verdict;
      confidence: number;
      probabilities: Record<Verdict, number>;
      model: string;
      provider?: string;
      requestId?: string;
      usage?: { inputTokens: number; outputTokens: number };
    };
    evaluatedAt: string;
  };
  review?: { verdict: Verdict; note?: string; reviewedAt: string };
};

type NewsItem = {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  fuente: string;
  gravedad: string;
  tipo: string;
  fechaNoticia: string | null;
  candidato: {
    nombre: string;
    partido: string;
    slug: string;
    eleccion: string;
    ambito: string | null;
    estado: string | null;
  };
  audit: Audit | null;
};

type AuditResponse = {
  news: NewsItem[];
  candidates: { nombre: string; slug: string }[];
  summary: Record<Verdict, number> & { total: number; audited: number };
  page: number;
  total: number;
  totalPages: number;
};

type QueueScope =
  | { label: string; election: "presidencial-2026" | "municipal-2026" }
  | { label: string; candidate: string };

type QueuePreview = QueueScope & {
  ids: number[];
  total: number;
  truncated: boolean;
  limit: number;
  nextCursor: number | null;
};

type BatchState = {
  label: string;
  current: number;
  total: number;
  successes: number;
  failures: number;
  running: boolean;
  cancelled: boolean;
  lastError?: string;
  stoppedReason?: string;
};

type EvaluationOutcome = { succeeded: true } | { succeeded: false; error?: string };

const MAX_EVALUATION_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 30_000;
const CIRCUIT_BREAKER_FAILURES = 3;

export function shouldRetryAuditError(status: number, transient: boolean, retryCount: number): boolean {
  return transient
    && retryCount < MAX_EVALUATION_RETRIES
    && [0, 429, 502, 503, 504].includes(status);
}

export function auditRetryDelayMs(retryCount: number, retryAfter: string | null, now = Date.now()): number {
  const exponentialDelay = 500 * (2 ** retryCount);
  if (!retryAfter) return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
  const seconds = Number(retryAfter);
  const requestedDelay = Number.isFinite(seconds) ? seconds * 1_000 : Date.parse(retryAfter) - now;
  return Math.min(Math.max(exponentialDelay, Number.isFinite(requestedDelay) ? requestedDelay : 0), MAX_RETRY_DELAY_MS);
}

export function shouldStopAuditBatch(consecutiveFailures: number): boolean {
  return consecutiveFailures >= CIRCUIT_BREAKER_FAILURES;
}

function waitForRetry(delay: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delay);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

const verdictCopy: Record<Verdict, { label: string; symbol: string; tone: string; bar: string }> = {
  BELONGS: { label: "Sí pertenece", symbol: "✓", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", bar: "bg-emerald-400" },
  DOES_NOT_BELONG: { label: "No pertenece", symbol: "×", tone: "border-red-500/30 bg-red-500/10 text-red-300", bar: "bg-red-400" },
  UNCERTAIN: { label: "Revisión necesaria", symbol: "?", tone: "border-amber-500/30 bg-amber-500/10 text-amber-200", bar: "bg-amber-300" },
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const copy = verdictCopy[verdict];
  return <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold uppercase tracking-wider ${copy.tone}`}><span aria-hidden="true">{copy.symbol}</span>{copy.label}</span>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(value)) : "Fecha no registrada";
}

function ReviewControls({ item, onSaved }: { item: NewsItem; onSaved: (audit: Audit) => void }) {
  const formId = useId();
  const suggested = item.audit?.review?.verdict ?? item.audit?.machine?.result.verdict ?? "UNCERTAIN";
  const [verdict, setVerdict] = useState<Verdict>(suggested);
  const [note, setNote] = useState(item.audit?.review?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const machineVerdict = item.audit?.machine?.result.verdict;

  async function saveReview() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/local-admin/news-audit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: item.id, verdict, note }),
      });
      const payload = await response.json() as { audit?: Audit; error?: string };
      if (!response.ok || !payload.audit) throw new Error(payload.error || "No se pudo guardar la revisión.");
      onSaved(payload.audit);
      setMessage(machineVerdict === verdict ? "Resultado confirmado por una persona." : "Excepción humana guardada localmente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la revisión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <fieldset className="mt-5 border-t border-slate-700/70 pt-4">
      <legend className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Decisión humana</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-300" htmlFor={`${formId}-verdict`}>
          Veredicto final
          <select id={`${formId}-verdict`} value={verdict} onChange={(event) => setVerdict(event.target.value as Verdict)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-white">
            {VERDICTS.map((value) => <option key={value} value={value}>{verdictCopy[value].label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-300" htmlFor={`${formId}-note`}>
          Nota de revisión <span className="font-normal text-slate-500">(opcional)</span>
          <input id={`${formId}-note`} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Motivo de la confirmación o excepción" className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600" />
        </label>
        <button type="button" onClick={saveReview} disabled={saving} className="min-h-11 rounded-lg bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60">
          {saving ? "Guardando…" : machineVerdict === verdict ? "Confirmar" : "Guardar excepción"}
        </button>
      </div>
      <p className="mt-2 min-h-5 text-xs text-slate-400" aria-live="polite">{message || "La revisión se guarda solo en el archivo local; no modifica la base de datos."}</p>
    </fieldset>
  );
}

function AuditCard({ item, busy, evaluationLocked, onEvaluate, onAuditChange, message }: { item: NewsItem; busy: boolean; evaluationLocked: boolean; onEvaluate: () => void; onAuditChange: (audit: Audit) => void; message?: string }) {
  const machine = item.audit?.machine;
  const finalVerdict = item.audit?.review?.verdict ?? machine?.result.verdict;
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="border-b border-slate-700/70 bg-slate-950/40 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-400">Expediente #{item.id} · {item.fuente}</p>
            <h2 className="mt-2 text-lg font-black leading-snug text-white sm:text-xl">{item.titulo}</h2>
          </div>
          {item.audit?.review ? <span className="inline-flex min-h-7 items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 text-[11px] font-bold uppercase tracking-wider text-sky-200">Revisión humana</span> : finalVerdict ? <VerdictBadge verdict={finalVerdict} /> : <span className="inline-flex min-h-7 items-center rounded-full border border-slate-600 px-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">Sin auditar</span>}
        </div>
      </div>

      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section aria-label="Evidencia del artículo y candidato">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Candidato asignado</p>
              <p className="mt-1 font-bold text-white">{item.candidato.nombre}</p>
              <p className="text-sm text-slate-400">{item.candidato.partido}</p>
              <p className="mt-1 text-xs text-slate-500">{[item.candidato.eleccion, item.candidato.ambito, item.candidato.estado].filter(Boolean).join(" · ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Ficha periodística</p>
              <p className="mt-1 text-sm text-slate-300">{formatDate(item.fechaNoticia)}</p>
              <p className="mt-1 text-xs text-slate-500">Clasificación: {item.tipo} · {item.gravedad}</p>
              <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-red-300 underline decoration-red-500/40 underline-offset-4 hover:text-red-200">Abrir fuente original ↗</a>
            </div>
          </div>
          <p className="mt-4 border-l-2 border-red-500/60 pl-4 text-sm leading-6 text-slate-300">{item.descripcion}</p>
        </section>

        <section aria-label="Dictamen de Jev" className="rounded-xl border border-slate-700 bg-slate-950/55 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dictamen Jev</p>
            <button type="button" onClick={onEvaluate} disabled={evaluationLocked} className="min-h-11 rounded-lg border border-red-500/40 bg-red-500/10 px-3 text-xs font-black uppercase tracking-wider text-red-200 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60">{busy ? "Evaluando…" : machine ? "Reevaluar" : "Evaluar"}</button>
          </div>
          {machine ? (
            <div className="mt-4">
              <VerdictBadge verdict={machine.result.verdict} />
              <p className="mt-3 text-3xl font-black text-white">{Math.round(machine.result.confidence * 100)}<span className="text-base text-slate-500">% confianza</span></p>
              <div className="mt-4 space-y-3">
                {VERDICTS.map((verdict) => <div key={verdict}><div className="mb-1 flex justify-between gap-2 text-[11px] text-slate-400"><span>{verdictCopy[verdict].label}</span><span>{Math.round(machine.result.probabilities[verdict] * 100)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${verdictCopy[verdict].bar}`} style={{ width: `${machine.result.probabilities[verdict] * 100}%` }} /></div></div>)}
              </div>
              <p className="mt-4 text-xs text-slate-400"><span aria-hidden="true">{machine.evidence.deterministic.suggestedCandidateMatch ? "✓" : "×"}</span> Coincidencia determinística: <strong className="text-slate-200">{machine.evidence.deterministic.suggestedCandidateMatch ? "sí" : "no"}</strong></p>
              <p className="mt-2 break-words text-[11px] leading-5 text-slate-500">Modelo: {machine.result.model}{machine.result.provider ? ` · ${machine.result.provider}` : ""}{machine.result.requestId ? ` · Solicitud ${machine.result.requestId}` : ""}{machine.result.usage ? ` · ${machine.result.usage.inputTokens + machine.result.usage.outputTokens} tokens` : ""}</p>
            </div>
          ) : <p className="mt-5 text-sm leading-6 text-slate-400">Todavía no hay evidencia del modelo. La evaluación no cambia ni elimina esta noticia.</p>}
          {message && <p role="status" className="mt-3 text-xs text-amber-200">{message}</p>}
        </section>
      </div>
      <div className="px-5 pb-5 sm:px-6"><ReviewControls key={`${item.id}-${item.audit?.review?.reviewedAt ?? machine?.evaluatedAt ?? "new"}`} item={item} onSaved={onAuditChange} /></div>
    </article>
  );
}

async function fetchPendingQueue(
  scope: QueueScope,
  afterId?: number,
  signal?: AbortSignal,
): Promise<QueuePreview> {
  const params = new URLSearchParams({ queue: "pending" });
  if ("election" in scope) params.set("election", scope.election);
  else params.set("candidate", scope.candidate);
  if (afterId) params.set("afterId", String(afterId));
  const response = await fetch(`/api/local-admin/news-audit?${params}`, {
    cache: "no-store",
    signal,
  });
  const payload = await response.json() as Omit<QueuePreview, keyof QueueScope> & { error?: string };
  if (!response.ok) throw new Error(payload.error || "No se pudo preparar la cola pendiente.");
  return { ...scope, ...payload };
}

function QueueConfirmationDialog({
  preview,
  onCancel,
  onConfirm,
}: {
  preview: QueuePreview;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
      aria-labelledby="queue-confirm-title"
      aria-describedby="queue-confirm-description"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-600 bg-slate-900 p-5 text-white shadow-2xl backdrop:bg-slate-950/85"
    >
      <h2 id="queue-confirm-title" className="text-xl font-black">Confirmar cola: {preview.label}</h2>
      <p id="queue-confirm-description" className="mt-3 text-sm leading-6 text-slate-300">
        Hay <strong>{preview.total} noticias pendientes</strong>. Se procesarán todas en bloques de hasta {preview.limit}, una por una. Cada resultado se guarda localmente antes de avanzar.
      </p>
      {preview.total === 0 && <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">No quedan noticias sin auditar en este alcance.</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold text-slate-200">Cancelar</button>
        <button type="button" autoFocus onClick={onConfirm} disabled={!preview.ids.length} className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-black text-white hover:bg-red-500 disabled:opacity-50">Iniciar {preview.total} evaluaciones</button>
      </div>
    </dialog>
  );
}

export function NewsAuditDesk() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [candidate, setCandidate] = useState("");
  const [status, setStatus] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [batch, setBatch] = useState<BatchState | null>(null);
  const [queuePreview, setQueuePreview] = useState<QueuePreview | null>(null);
  const [queueLoading, setQueueLoading] = useState("");
  const batchController = useRef<AbortController | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (candidate) params.set("candidate", candidate);
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    try {
      const response = await fetch(`/api/local-admin/news-audit?${params}`, { signal, cache: "no-store" });
      const payload = await response.json() as AuditResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar la mesa de auditoría.");
      setData(payload);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "No se pudo cargar la mesa de auditoría.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [candidate, page, query, status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function updateAudit(newsId: number, audit: Audit) {
    setData((current) => current ? { ...current, news: current.news.map((item) => item.id === newsId ? { ...item, audit } : item) } : current);
  }

  async function evaluate(newsId: number, signal?: AbortSignal): Promise<EvaluationOutcome> {
    setBusyId(newsId);
    setMessages((current) => ({ ...current, [newsId]: "" }));
    try {
      for (let retryCount = 0; ; retryCount++) {
        let response: Response;
        try {
          response = await fetch("/api/local-admin/news-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newsId }), signal });
        } catch (reason) {
          if (signal?.aborted) return { succeeded: false };
          if (shouldRetryAuditError(0, true, retryCount)) {
            await waitForRetry(auditRetryDelayMs(retryCount, null), signal);
            continue;
          }
          throw reason;
        }

        const payload = await response.json().catch(() => ({})) as { audit?: Audit; error?: string; transient?: boolean };
        if (response.ok && payload.audit) {
          updateAudit(newsId, payload.audit);
          return { succeeded: true };
        }
        const message = payload.error || "La evaluación no pudo completarse.";
        if (shouldRetryAuditError(response.status, payload.transient === true, retryCount)) {
          await waitForRetry(auditRetryDelayMs(retryCount, response.headers.get("Retry-After")), signal);
          continue;
        }
        throw new Error(message);
      }
    } catch (reason) {
      if (signal?.aborted) return { succeeded: false };
      const message = reason instanceof Error ? reason.message : "La evaluación no pudo completarse.";
      setMessages((current) => ({ ...current, [newsId]: message }));
      return { succeeded: false, error: message };
    } finally {
      setBusyId(null);
    }
  }

  async function evaluateVisible() {
    if (!data?.news.length) return;
    let successes = 0;
    let failures = 0;
    let consecutiveFailures = 0;
    let lastError: string | undefined;
    setBatch({ label: "Página visible", current: 0, total: data.news.length, successes, failures, running: true, cancelled: false });
    for (let index = 0; index < data.news.length; index++) {
      const outcome = await evaluate(data.news[index].id);
      if (outcome.succeeded) {
        successes++;
        consecutiveFailures = 0;
      } else {
        failures++;
        consecutiveFailures++;
        lastError = outcome.error;
      }
      const stoppedReason = shouldStopAuditBatch(consecutiveFailures)
        ? `Cola detenida tras ${CIRCUIT_BREAKER_FAILURES} fallos consecutivos.`
        : undefined;
      setBatch({ label: "Página visible", current: index + 1, total: data.news.length, successes, failures, running: !stoppedReason && index + 1 < data.news.length, cancelled: false, lastError, stoppedReason });
      if (stoppedReason) break;
    }
    await load();
  }

  async function prepareQueue(scope: QueueScope) {
    setQueueLoading(scope.label);
    setError("");
    try {
      setQueuePreview(await fetchPendingQueue(scope));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo preparar la cola pendiente.");
    } finally {
      setQueueLoading("");
    }
  }

  async function runPreparedQueue() {
    if (!queuePreview?.ids.length) return;
    const queue = queuePreview;
    const controller = new AbortController();
    batchController.current = controller;
    setQueuePreview(null);
    let successes = 0;
    let failures = 0;
    let processed = 0;
    let consecutiveFailures = 0;
    let lastError: string | undefined;
    let stoppedReason: string | undefined;
    let chunk = queue;
    setBatch({ label: queue.label, current: 0, total: queue.total, successes, failures, running: true, cancelled: false });

    while (chunk.ids.length && !controller.signal.aborted) {
      for (const newsId of chunk.ids) {
        if (controller.signal.aborted) break;
        const outcome = await evaluate(newsId, controller.signal);
        if (controller.signal.aborted) break;
        if (outcome.succeeded) {
          successes++;
          consecutiveFailures = 0;
        } else {
          failures++;
          consecutiveFailures++;
          lastError = outcome.error;
        }
        processed++;
        stoppedReason = shouldStopAuditBatch(consecutiveFailures)
          ? `Cola detenida tras ${CIRCUIT_BREAKER_FAILURES} fallos consecutivos.`
          : undefined;
        setBatch({ label: queue.label, current: processed, total: queue.total, successes, failures, running: !stoppedReason, cancelled: false, lastError, stoppedReason });
        if (stoppedReason) break;
      }
      if (controller.signal.aborted || stoppedReason || !chunk.nextCursor) break;
      try {
        chunk = await fetchPendingQueue(queue, chunk.nextCursor, controller.signal);
      } catch (reason) {
        if (!controller.signal.aborted) {
          lastError = reason instanceof Error ? reason.message : "No se pudo continuar la cola.";
          stoppedReason = "La cola se detuvo porque no se pudo cargar el siguiente bloque.";
        }
        break;
      }
    }

    const cancelled = controller.signal.aborted;
    batchController.current = null;
    setBatch((current) => current ? { ...current, successes, failures, running: false, cancelled, lastError, stoppedReason } : current);
    await load();
  }

  function cancelBatch() {
    batchController.current?.abort();
  }

  const selectedCandidate = data?.candidates.find((item) => item.slug === candidate);
  const batchRunning = batch?.running ?? false;

  const summaries = data ? [
    ["Total", data.summary.total],
    ["Sin auditar", Math.max(0, data.summary.total - data.summary.audited)],
    ["Sí pertenece", data.summary.BELONGS],
    ["No pertenece", data.summary.DOES_NOT_BELONG],
    ["Revisión necesaria", data.summary.UNCERTAIN],
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_38%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-red-400">Herramienta local · Evidencia, no automatización</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div><h1 className="text-3xl font-black tracking-tight sm:text-5xl">Mesa de auditoría editorial</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Revise la atribución de cada noticia antes de tomar decisiones fuera de esta herramienta. Nada aquí elimina ni reasigna registros.</p></div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-100"><span aria-hidden="true">●</span> Solo localhost · Archivo local</div>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-5">{summaries.map(([label, value]) => <div key={label} className="bg-slate-950/90 px-4 py-4"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-black text-white">{value}</dd></div>)}</dl>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <form onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(queryInput.trim()); }} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/65 p-4 md:grid-cols-[1fr_0.8fr_0.8fr_auto] md:items-end">
          <label className="text-xs font-bold text-slate-300">Buscar evidencia<input type="search" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Titular, resumen o candidato" className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm placeholder:text-slate-600" /></label>
          <label className="text-xs font-bold text-slate-300">Candidato<select value={candidate} onChange={(event) => { setCandidate(event.target.value); setPage(1); }} className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm"><option value="">Todos</option>{data?.candidates.map((item) => <option key={item.slug} value={item.slug}>{item.nombre}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-300">Estado<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm"><option value="">Todos</option><option value="UNAUDITED">Sin auditar</option>{VERDICTS.map((value) => <option key={value} value={value}>{verdictCopy[value].label}</option>)}</select></label>
          <button className="min-h-11 rounded-lg bg-red-600 px-5 text-sm font-black text-white hover:bg-red-500">Aplicar filtros</button>
        </form>

        <div className="my-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400" aria-live="polite">{data ? `${data.total} resultados · Página ${data.page} de ${Math.max(1, data.totalPages)}` : "Cargando resultados…"}</p>
          <button type="button" onClick={evaluateVisible} disabled={batchRunning || Boolean(busyId) || !data?.news.length} className="min-h-11 rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-xs font-black uppercase tracking-wider text-red-200 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60">{batchRunning && batch?.label === "Página visible" ? `Evaluando ${batch.current} de ${batch.total}…` : "Evaluar página en secuencia"}</button>
        </div>

        <section aria-labelledby="bulk-audit-title" className="mb-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 id="bulk-audit-title" className="font-black text-white">Evaluación masiva pendiente</h2><p className="mt-1 text-sm text-slate-400">Primero se consulta la cola exacta. Solo se incluyen noticias sin auditoría local.</p></div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">Secuencial · cancelable</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => void prepareQueue({ label: "Presidenciales", election: "presidencial-2026" })} disabled={batchRunning || Boolean(queueLoading)} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold text-slate-100 hover:border-red-400 hover:bg-red-500/10 disabled:opacity-50">{queueLoading === "Presidenciales" ? "Consultando…" : "Preparar presidenciales"}</button>
            <button type="button" onClick={() => void prepareQueue({ label: "Municipales", election: "municipal-2026" })} disabled={batchRunning || Boolean(queueLoading)} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold text-slate-100 hover:border-red-400 hover:bg-red-500/10 disabled:opacity-50">{queueLoading === "Municipales" ? "Consultando…" : "Preparar municipales"}</button>
            <button type="button" onClick={() => candidate && void prepareQueue({ label: selectedCandidate?.nombre ?? candidate, candidate })} disabled={!candidate || batchRunning || Boolean(queueLoading)} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold text-slate-100 hover:border-red-400 hover:bg-red-500/10 disabled:opacity-50">{candidate ? `Preparar ${selectedCandidate?.nombre ?? "candidato"}` : "Seleccione un candidato"}</button>
          </div>
          {batch && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4" role="status" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold text-white">{batch.label}: {batch.current} de {batch.total}</p>{batch.running ? <button type="button" onClick={cancelBatch} className="min-h-11 rounded-lg border border-amber-500/50 px-4 text-sm font-black text-amber-200 hover:bg-amber-500/10">Detener cola</button> : <button type="button" onClick={() => setBatch(null)} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold text-slate-200">Cerrar resultado</button>}</div>
            <p className="mt-2 text-sm text-slate-400">{batch.successes} completadas · {batch.failures} fallidas{batch.cancelled ? " · Cola cancelada; puede reanudar consultando pendientes otra vez." : batch.stoppedReason ? ` · ${batch.stoppedReason}` : batch.running ? " · Se detendrá tras tres fallos consecutivos." : " · Proceso finalizado."}</p>
            {batch.lastError && <p className="mt-2 text-sm text-amber-200">Último error: {batch.lastError}</p>}
          </div>}
        </section>

        {queuePreview && <QueueConfirmationDialog preview={queuePreview} onCancel={() => setQueuePreview(null)} onConfirm={() => void runPreparedQueue()} />}

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
        {loading && !data ? <div className="rounded-2xl border border-slate-800 p-10 text-center text-slate-400" role="status">Cargando expedientes…</div> : null}
        <div className="space-y-5">{data?.news.map((item) => <AuditCard key={item.id} item={item} busy={busyId === item.id} evaluationLocked={batchRunning || busyId !== null} onEvaluate={() => void evaluate(item.id)} onAuditChange={(audit) => { updateAudit(item.id, audit); void load(); }} message={messages[item.id]} />)}</div>
        {data && !data.news.length && <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center"><p className="font-bold text-slate-200">No hay expedientes con estos filtros.</p><p className="mt-2 text-sm text-slate-500">Pruebe otra búsqueda o estado de auditoría.</p></div>}

        {data && data.totalPages > 1 && <nav aria-label="Paginación de expedientes" className="mt-7 flex items-center justify-center gap-3"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold disabled:opacity-40">← Anterior</button><span className="text-sm text-slate-400">{page} / {data.totalPages}</span><button type="button" onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))} disabled={page >= data.totalPages} className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm font-bold disabled:opacity-40">Siguiente →</button></nav>}
      </div>
    </div>
  );
}
