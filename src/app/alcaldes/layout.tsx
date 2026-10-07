import Script from "next/script";
import type { ReactNode } from "react";
import { isProductionAnalyticsEnvironment } from "@/lib/analytics";

// Adsterra popunder: opens one ad tab on the first click of a page. Loaded only
// on the mayor routes (list, profile, versus, district) and only on Vercel
// production so local and preview sessions are not interrupted.
const POPUNDER_SRC = "https://abscloud.org/1/7fe11d2f1947cc883aff592a8b9ee9ae";

const popunderEnabled = isProductionAnalyticsEnvironment({
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
});

export default function AlcaldesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {popunderEnabled && (
        <Script src={POPUNDER_SRC} strategy="lazyOnload" data-cfasync="false" />
      )}
    </>
  );
}
