import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { and, or, sql } from "drizzle-orm";
import { normalizeForMatch, tokenizeQuery } from "@/lib/search";

// 이름·주소의 공백을 SQL 레벨에서 제거한 뒤 비교한다(정규화 규칙 ①) — DB 스키마를 안 바꾸고도
// "더샵 리비테르"와 "더샵리비테르" 같은 표기 차이를 흡수한다.
const normalizedName = sql`replace(lower(${complexes.name}), ' ', '')`;
const normalizedAddress = sql`replace(lower(${complexes.address}), ' ', '')`;

/** 홈 검색과 자동완성 API가 공유하는 단지 검색 로직. */
export function searchComplexes(q: string, limit = 20) {
  if (!q.trim()) return [];
  const tokens = tokenizeQuery(q);

  // 토큰마다 "이름 또는 주소에 포함되는지"를 확인하고, 모든 토큰을 AND로 묶는다(정규화 규칙 ②).
  const tokenConditions = tokens.map((token) => {
    const pattern = `%${normalizeForMatch(token)}%`;
    return or(sql`${normalizedName} LIKE ${pattern}`, sql`${normalizedAddress} LIKE ${pattern}`);
  });

  const rows = db
    .select()
    .from(complexes)
    .where(and(...tokenConditions))
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
