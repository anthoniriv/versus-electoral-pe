export const ANALYTICS_EVENTS = {
  comparisonStarted: "comparison_started",
  comparisonCompleted: "comparison_completed",
  ctaClicked: "cta_click",
  searchPerformed: "search_performed",
  searchResultSelected: "search_result_selected",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsGtag = (...args: unknown[]) => void;

export type AnalyticsPagePath =
  | "/"
  | "/alcaldes"
  | "/alcaldes/versus"
  | "/alcaldes/[slug]"
  | "/alcaldes/distrito/[distrito]"
  | "/candidato/[slug]"
  | "/versus"
  | "/other";

export interface AnalyticsPageContext {
  page_path: AnalyticsPagePath;
  page_location: string;
  page_title: "Versus Electoral";
  page_referrer: "";
}

export const ANALYTICS_CTAS = ["compare_candidates", "voting_place", "support"] as const;
export const ANALYTICS_CTA_LOCATIONS = ["home_hero", "header", "footer"] as const;
export const ANALYTICS_RESULT_TYPES = ["candidate", "district"] as const;

export type AnalyticsCta = (typeof ANALYTICS_CTAS)[number];
export type AnalyticsCtaLocation = (typeof ANALYTICS_CTA_LOCATIONS)[number];
export type AnalyticsResultType = (typeof ANALYTICS_RESULT_TYPES)[number];

/**
 * Event parameters. Only enums and counts are allowed: never search text,
 * candidate names, slugs or districts, which could reveal political interest.
 */
export interface AnalyticsEventParamsMap {
  comparison_started: Record<never, never>;
  comparison_completed: Record<never, never>;
  cta_click: { cta: AnalyticsCta; cta_location: AnalyticsCtaLocation };
  search_performed: { query_length: number; result_count: number };
  search_result_selected: {
    result_type: AnalyticsResultType;
    result_position: number;
    query_length: number;
    result_count: number;
  };
}

export interface AnalyticsEventInput {
  pathname: string;
  siteOrigin: string;
}

type AnalyticsEventMap = {
  [EventName in AnalyticsEventName]: AnalyticsEventInput & AnalyticsEventParamsMap[EventName];
};

type ParamRule = (value: unknown) => boolean;

const MAX_COUNT = 10_000;

function oneOf(values: readonly string[]): ParamRule {
  return (value) => typeof value === "string" && values.includes(value);
}

const isCount: ParamRule = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;

const EVENT_PARAM_RULES: Record<AnalyticsEventName, Record<string, ParamRule>> = {
  comparison_started: {},
  comparison_completed: {},
  cta_click: {
    cta: oneOf(ANALYTICS_CTAS),
    cta_location: oneOf(ANALYTICS_CTA_LOCATIONS),
  },
  search_performed: { query_length: isCount, result_count: isCount },
  search_result_selected: {
    result_type: oneOf(ANALYTICS_RESULT_TYPES),
    result_position: isCount,
    query_length: isCount,
    result_count: isCount,
  },
};

/** Keeps only the approved fields of an event; returns null if any is missing or invalid. */
function pickEventParams(
  eventName: AnalyticsEventName,
  input: object,
): Record<string, unknown> | null {
  const params: Record<string, unknown> = {};
  for (const [key, isValid] of Object.entries(EVENT_PARAM_RULES[eventName])) {
    const value = (input as Record<string, unknown>)[key];
    if (!isValid(value)) return null;
    params[key] = value;
  }
  return params;
}

export function isAnalyticsCta(value: unknown): value is AnalyticsCta {
  return oneOf(ANALYTICS_CTAS)(value);
}

export function isAnalyticsCtaLocation(value: unknown): value is AnalyticsCtaLocation {
  return oneOf(ANALYTICS_CTA_LOCATIONS)(value);
}

const EVENT_ALLOWLIST = new Set<AnalyticsEventName>(
  Object.values(ANALYTICS_EVENTS),
);

const STATIC_PAGE_PATHS = new Set<AnalyticsPagePath>([
  "/",
  "/alcaldes",
  "/alcaldes/versus",
  "/versus",
]);

function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || "/";
  if (pathOnly === "/") return pathOnly;
  return pathOnly.replace(/\/+$/, "") || "/";
}

export function toAnalyticsPagePath(pathname: string): AnalyticsPagePath {
  const path = normalizePathname(pathname);

  if (STATIC_PAGE_PATHS.has(path as AnalyticsPagePath)) {
    return path as AnalyticsPagePath;
  }
  if (/^\/alcaldes\/distrito\/[^/]+$/.test(path)) {
    return "/alcaldes/distrito/[distrito]";
  }
  if (/^\/alcaldes\/[^/]+$/.test(path)) return "/alcaldes/[slug]";
  if (/^\/candidato\/[^/]+$/.test(path)) return "/candidato/[slug]";

  return "/other";
}

export function createAnalyticsPageContext(
  pathname: string,
  siteOrigin: string,
): AnalyticsPageContext {
  const pagePath = toAnalyticsPagePath(pathname);
  return {
    page_path: pagePath,
    page_location: `${siteOrigin.replace(/\/$/, "")}${pagePath}`,
    page_title: "Versus Electoral",
    page_referrer: "",
  };
}

export function createAnalyticsConfig(pathname: string, siteOrigin: string) {
  return {
    ...createAnalyticsPageContext(pathname, siteOrigin),
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  } as const;
}

function serializeForInlineScript(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function createAnalyticsInitScript(
  gaId: string,
  pathname: string,
  siteOrigin: string,
): string {
  const context = createAnalyticsPageContext(pathname, siteOrigin);
  const config = createAnalyticsConfig(pathname, siteOrigin);
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('set', ${serializeForInlineScript(context)});
    gtag('config', ${serializeForInlineScript(gaId)}, ${serializeForInlineScript(config)});
  `;
}

export function dispatchAnalyticsEvent<EventName extends AnalyticsEventName>(
  gtag: AnalyticsGtag | undefined,
  eventName: EventName,
  input: AnalyticsEventMap[EventName],
): boolean {
  if (!gtag || !EVENT_ALLOWLIST.has(eventName)) return false;

  try {
    const params = pickEventParams(eventName, input);
    if (!params) return false;
    const context = createAnalyticsPageContext(input.pathname, input.siteOrigin);
    gtag("event", eventName, { ...context, ...params });
    return true;
  } catch {
    return false;
  }
}

type ParamsArgs<EventName extends AnalyticsEventName> =
  keyof AnalyticsEventParamsMap[EventName] extends never
    ? []
    : [params: AnalyticsEventParamsMap[EventName]];

export function trackEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  ...[params]: ParamsArgs<EventName>
): boolean {
  if (typeof window === "undefined") return false;
  return dispatchAnalyticsEvent(window.gtag, eventName, {
    ...params,
    pathname: window.location.pathname,
    siteOrigin: window.location.origin,
  } as AnalyticsEventMap[EventName]);
}

export function createPageViewTracker(
  gtag: AnalyticsGtag,
  siteOrigin: string,
): (pathname: string) => boolean {
  let previousPathname: string | undefined;

  return (pathname: string) => {
    const normalizedPathname = normalizePathname(pathname);
    if (normalizedPathname === previousPathname) return false;

    const context = createAnalyticsPageContext(normalizedPathname, siteOrigin);
    try {
      gtag("set", context);
      gtag("event", "page_view", context);
      previousPathname = normalizedPathname;
      return true;
    } catch {
      return false;
    }
  };
}

export function isProductionAnalyticsEnvironment(environment: {
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
}): boolean {
  return (
    environment.nodeEnv === "production" &&
    environment.vercelEnv === "production"
  );
}

declare global {
  interface Window {
    gtag?: AnalyticsGtag;
    dataLayer?: unknown[];
  }
}
