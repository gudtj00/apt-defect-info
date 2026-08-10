// 축① 단지 검색 정규화 규칙.
// 실사(2026-08-06, 전체 22,260건 적재 후) 근거:
//   - 단지명에 공백이 섞인 비율 16.7%(3,713건)인데 표기가 들쭉날쭉하다
//     (예: "더샵 리비테르 2차" vs "더샵리비테르1차") — 문자열 그대로 부분일치하면
//     사용자가 조금만 다르게 띄어 써도 못 찾는다.
//   - 단지명에 "아파트"가 포함된 비율은 33.6%(7,486/22,260)뿐이다 — 나머지 66%는
//     이름에 "아파트"가 아예 없어서, "OO 아파트"로 검색하면 실패하는 경우가 흔하다.
// 그래서 두 규칙으로 정규화한다: ①공백 제거 후 비교 ②검색어를 단어 단위로 쪼개 전부
// 포함하는지(AND) 확인하되 "아파트" 같은 범용 단어는 없어도 되는 걸로 취급한다.

/** 순수 접미어 — 검색어에 있어도 없어도 매칭에 영향을 주지 않는 범용 단어. */
const STOPWORDS = new Set(["아파트", "apt"]);

/** 공백 제거 + 소문자화. DB 컬럼과 검색어 양쪽에 동일하게 적용해서 비교 기준을 맞춘다. */
export function normalizeForMatch(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

/**
 * 검색어를 공백 기준으로 토큰화하고, 순수 "아파트" 토큰은 제거한다.
 * 전부 걸러져서 빈 배열이 되면(예: 검색어가 "아파트" 하나뿐인 경우) 원래 토큰으로 되돌린다 —
 * 빈 조건으로 전체 결과가 나오는 걸 막기 위해서다.
 */
export function tokenizeQuery(query: string): string[] {
  const raw = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
  const withoutStopwords = raw.filter((t) => !STOPWORDS.has(t));
  return withoutStopwords.length > 0 ? withoutStopwords : raw;
}
