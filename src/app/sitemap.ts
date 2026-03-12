import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/candidato`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const candidatos = await prisma.candidato.findMany({
      select: { slug: true, updatedAt: true },
    });

    for (const c of candidatos) {
      entries.push({
        url: `${SITE_URL}/candidato/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // DB not ready
  }

  return entries;
}
