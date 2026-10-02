import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NewsAuditDesk } from "@/components/local-admin/NewsAuditDesk";
import { isLocalAdminRequest } from "@/lib/local-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mesa local de auditoría",
  robots: { index: false, follow: false, nocache: true },
};

export default async function NewsAuditPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  let isLocal = false;

  if (host) {
    try {
      isLocal = isLocalAdminRequest(new Request(`http://${host}/local-admin/news-audit`));
    } catch {
      isLocal = false;
    }
  }

  if (!isLocal) notFound();

  return <NewsAuditDesk />;
}
