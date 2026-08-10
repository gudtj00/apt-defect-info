import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { getAllDefectSlugs } from "@/lib/defects";
import { SITE_URL } from "@/lib/site";

// 데이터가 배치로 계속 늘어나는 중이라(pipeline/ingest_complexes.mjs all) 이 파일은
// 매 빌드 시점 DB 상태를 그대로 반영한다 — 정적 목록을 하드코딩하지 않는다.
export default function sitemap(): MetadataRoute.Sitemap {
  const aptSlugs = db.select({ slug: complexes.slug, fetchedAt: complexes.fetchedAt }).from(complexes).all();
  const defectSlugs = getAllDefectSlugs();

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/defect`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/defect/articles`, changeFrequency: "monthly", priority: 0.5 },
    ...defectSlugs.map((slug) => ({
      url: `${SITE_URL}/defect/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...aptSlugs.map((c) => ({
      url: `${SITE_URL}/apt/${c.slug}`,
      lastModified: new Date(c.fetchedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
