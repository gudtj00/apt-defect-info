// 아직 실제 배포 도메인이 정해지지 않았다 — 지어내지 않고 환경변수로 명시하게 한다.
// 배포 전에는 반드시 .env에 SITE_URL을 실제 도메인으로 설정할 것 (sitemap.xml, canonical URL이 이 값을 쓴다).
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
