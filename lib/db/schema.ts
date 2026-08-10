// Phase 4 축① 스코프의 최소 스키마. 브리핑의 전체 스키마 초안(builders, disclosures,
// warranty_bonds, corrections 등) 중 단지 검색/상세 페이지에 필요한 부분만 우선 구현했다.
// 나머지 테이블은 축③(건설사 명단) 등 이후 스코프에서 추가한다.
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const complexes = sqliteTable("complexes", {
  kaptCode: text("kapt_code").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  region: text("region"), // K-apt as1 (시도)
  address: text("address"),
  roadAddress: text("road_address"),
  // K-apt kaptUsedate 원본 형식(YYYYMMDD) 그대로 저장 — lib/warranty-calc.ts가 이 형식을 기대한다.
  // null이면 "정보 없음" — 절대 추정하지 않는다(Phase 2 원칙).
  usedate: text("usedate"),
  householdCount: integer("household_count"),
  dongCount: integer("dong_count"),
  builderName: text("builder_name"), // kaptBcompany. null이면 "시공사 정보 없음"으로 표시
  saleType: text("sale_type"), // codeSaleNm
  fetchedAt: text("fetched_at").notNull(), // 수집 시각 — 데이터 신선도 표시용
});
