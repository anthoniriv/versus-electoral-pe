"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { searchHomeWithTotal, type HomeSearchEntry } from "@/lib/home-search";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { openSmartlinkOnce } from "@/components/SmartlinkLink";

/** Wait for the visitor to stop typing before counting a search. */
const SEARCH_TRACK_DELAY_MS = 1000;
const SEARCH_TRACK_MIN_LENGTH = 2;

export interface HomeSearchProps {
  /** Minimal serialized search index built on the server with buildHomeSearchIndex(). */
  index: HomeSearchEntry[];
}

/**
 * Hero search combobox: find a candidate or district by name, accent- and
 * case-insensitive. Follows the WAI-ARIA combobox (list autocomplete,
 * single-select) pattern: the input owns aria-expanded/controls/
 * activedescendant, results render as a listbox of option links.
 */
export function HomeSearch({ index }: HomeSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, total } = useMemo(() => searchHomeWithTotal(query, index), [query, index]);
  const hiddenCount = total - results.length;
  const hasResults = results.length > 0;
  const showListbox = open && query.trim().length > 0;

  // Only the query length and result count are sent, never the typed text.
  const trimmedLength = query.trim().length;
  const lastTrackedQuery = useRef("");
  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < SEARCH_TRACK_MIN_LENGTH || normalized === lastTrackedQuery.current) return;
    const timeout = window.setTimeout(() => {
      lastTrackedQuery.current = normalized;
      trackEvent(ANALYTICS_EVENTS.searchPerformed, {
        query_length: normalized.length,
        result_count: total,
      });
    }, SEARCH_TRACK_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [query, total]);

  function optionId(i: number): string {
    return `${listboxId}-option-${i}`;
  }

  function navigateTo(entry: HomeSearchEntry, position: number) {
    trackEvent(ANALYTICS_EVENTS.searchResultSelected, {
      result_type: entry.type,
      result_position: position + 1,
      query_length: trimmedLength,
      result_count: total,
    });
    setOpen(false);
    setActiveIndex(-1);
    // The only ads on the site: once per session, when a visitor picks a candidate.
    if (entry.type === "candidate") openSmartlinkOnce();
    router.push(entry.href);
  }

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showListbox || !hasResults) {
      if (event.key === "Escape") {
        setOpen(false);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          event.preventDefault();
          navigateTo(results[activeIndex].entry, activeIndex);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  const activeOptionId = activeIndex >= 0 && showListbox ? optionId(activeIndex) : undefined;

  const resultCountLabel = !showListbox
    ? ""
    : hasResults
      ? hiddenCount > 0
        ? `Mostrando ${results.length} de ${total} resultados`
        : `${results.length} resultado${results.length === 1 ? "" : "s"}`
      : "Sin resultados";

  return (
    <div className="relative mx-auto w-full max-w-3xl text-left">
      <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-white">
        Busca un candidato, partido o distrito
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder="Ej. apellido, partido o distrito"
          aria-expanded={showListbox}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          className="min-h-14 w-full rounded-2xl border border-gray-700 bg-gray-900/80 pl-12 pr-4 py-3.5 text-base text-white placeholder-gray-500 focus:border-red-500/70 focus:outline-none"
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {resultCountLabel}
      </p>

      {showListbox && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          // onMouseDown (not onClick) so the list item is still mounted when
          // the input's onBlur would otherwise have already closed it.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-20 mt-2 max-h-[min(26rem,60vh)] w-full overflow-y-auto overscroll-contain rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/40"
        >
          {hasResults ? (
            results.map((result, i) => {
              const isActive = i === activeIndex;
              return (
                <li
                  key={result.entry.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isActive}
                >
                  <a
                    href={result.entry.href}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateTo(result.entry, i);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors duration-150 ${
                      isActive ? "bg-red-600/20 text-white" : "text-gray-200"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{result.entry.label}</span>
                      <span className="block truncate text-xs text-gray-500">{result.entry.sublabel}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {result.entry.type === "candidate" ? "Candidato" : "Distrito"}
                    </span>
                  </a>
                </li>
              );
            }).concat(
              hiddenCount > 0
                ? [
                    <li key="more" role="presentation" className="border-t border-gray-800 px-4 py-3 text-xs text-gray-500">
                      Y {hiddenCount} más. Escribe un distrito o apellido para afinar la búsqueda.
                    </li>,
                  ]
                : [],
            )
          ) : (
            <li className="px-4 py-4 text-sm text-gray-500">
              No encontramos candidatos, partidos ni distritos con ese nombre.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
