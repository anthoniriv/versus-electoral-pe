"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SITE_URL } from "@/lib/site";
import {
  ANALYTICS_EVENTS,
  createAnalyticsInitScript,
  createPageViewTracker,
  isAnalyticsCta,
  isAnalyticsCtaLocation,
  trackEvent,
} from "@/lib/analytics";

const GA_ID = "G-PNX1K630F1";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const pageViewTracker = useRef<ReturnType<typeof createPageViewTracker>>(null);
  const initScript = createAnalyticsInitScript(GA_ID, pathname, SITE_URL);

  useEffect(() => {
    if (!isReady || typeof window.gtag !== "function") return;
    pageViewTracker.current ??= createPageViewTracker(window.gtag, SITE_URL);
    pageViewTracker.current(pathname);
  }, [isReady, pathname]);

  // One delegated listener tracks every element marked with
  // data-analytics-cta, so server components need no client wrapper.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-analytics-cta]");
      if (!element) return;
      const { analyticsCta: cta, analyticsLocation: location } = element.dataset;
      if (!isAnalyticsCta(cta) || !isAnalyticsCtaLocation(location)) return;
      trackEvent(ANALYTICS_EVENTS.ctaClicked, { cta, cta_location: location });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        onReady={() => setIsReady(true)}
      >
        {initScript}
      </Script>
    </>
  );
}
