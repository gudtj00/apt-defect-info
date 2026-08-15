import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { normalizeForMatch, tokenizeQuery } from "@/lib/search";

// 이름·주소의 공백을 SQL 레벨에서 제거한 뒤 비교한다(정규화 규칙 ①) — DB 스키마를 안 바꾸고도
// "더샵 리비테르"와 "더샵리비테르" 같은 표기 차이를 흡수한다.
const normalizedName = sql`replace(lower(${complexes.name}), ' ', '')`;
const normalizedAddress = sql`replace(lower(${complexes.address}), ' ', '')`;

/**
 * 검색과 자동완성 API가 공유하는 단지 검색 로직.
 *
 * region을 주면 그 시도 안에서만 찾는다. 지도에서 지역을 고른 경우가 이에 해당한다.
 * region 값은 DB의 complexes.region과 같은 문자열이어야 한다(data/region-map.json이
 * 빌드 시점에 DB 값과 대조되므로 둘은 항상 일치한다).
 */
export function searchComplexes(q: string, limit = 20, region?: string) {
  if (!q.trim()) return [];
  const tokens = tokenizeQuery(q);

  // 토큰마다 "이름 또는 주소에 포함되는지"를 확인하고, 모든 토큰을 AND로 묶는다(정규화 규칙 ②).
  const tokenConditions = tokens.map((token) => {
    const pattern = `%${normalizeForMatch(token)}%`;
    return or(sql`${normalizedName} LIKE ${pattern}`, sql`${normalizedAddress} LIKE ${pattern}`);
  });

  const conditions = region
    ? [...tokenConditions, eq(complexes.region, region)]
    : tokenConditions;

  const rows = db
    .select()
    .from(complexes)
    .where(and(...conditions))
    .limit(50)
    .all();

  // 정규화한 전체 검색어로 이름이 그대로 시작하는 것(가장 가까운 일치)을 우선 노출한다.
  const fullQueryNormalized = normalizeForMatch(tokens.join(""));
  rows.sort((a, b) => {
    const aStarts = normalizeForMatch(a.name).startsWith(fullQueryNormalized) ? 0 : 1;
    const bStarts = normalizeForMatch(b.name).startsWith(fullQueryNormalized) ? 0 : 1;
    return aStarts - bStarts;
  });

  return rows.slice(0, limit);
}
