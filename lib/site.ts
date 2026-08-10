// sitemap.xml과 canonical URL이 이 값을 쓴다.
//
// 2026-08-10: 배포 후 SITE_URL이 설정돼 있지 않아 sitemap 전체와 단지 페이지
// canonical이 http://localhost:3000 으로 나가는 사고가 있었다. 조용히 localhost로
// 대체되는 게 원인이었으므로, 배포 환경에서 값이 없으면 빌드를 실패시킨다.
const configured = process.env.SITE_URL;

if (!configured && process.env.VERCEL) {
  throw new Error(
    "SITE_URL is not set in a Vercel build. sitemap.xml and canonical URLs " +
      "would silently point at localhost and break search indexing. " +
      "Set it with: vercel env add SITE_URL",
  );
}

export const SITE_URL = configured ?? "http://localhost:3000";
