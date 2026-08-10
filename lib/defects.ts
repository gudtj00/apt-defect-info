// Phase 4 축② 하자 유형 사전 데이터 접근 레이어.
// data/defect-types.json(조문 상호참조) + data/defect-article-text.json(조문 원문)
// + data/warranty-periods.json(담보책임기간) + content/defects/*.md(5개 프로즈 콘텐츠)를 묶는다.

import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import defectTypesData from "@/data/defect-types.json";
import articleTextData from "@/data/defect-article-text.json";
import procedureArticleTextData from "@/data/procedure-article-text.json";
import warrantyPeriods from "@/data/warranty-periods.json";

export type DefectType = {
  code: string;
  name: string;
  judgmentArticle: string;
  investigationArticle: string | null;
  investigationNote?: string;
  repairCostArticle: string | null;
  repairCostNote?: string;
  warrantyCategoryCode: string | null;
  warrantyCategoryNote?: string;
  phenomenonTags: string[];
  plainExplanation?: string;
};

export const defectTypes: DefectType[] = defectTypesData.types as DefectType[];
export const knownGaps = defectTypesData.knownGaps;
export const phenomena = defectTypesData.phenomena;
export const defectSource = defectTypesData.source;

/**
 * 프로즈 콘텐츠(content/defects/*.md)가 있는 5개 페이지.
 * codes: 이 슬러그가 "대표 상세 페이지" 역할을 하는 조문 코드들 — 해당 코드는
 * 별도의 조문 참조 페이지(/defect/{code})를 만들지 않고 이 슬러그로 안내한다.
 * (기능불량·들뜸및탈락은 여러 조문을 모아 보여주는 허브 페이지라 개별 코드를 "대표"하지 않는다 —
 * 관련 조문들은 각자 자기 코드의 조문 참조 페이지를 그대로 가진다.)
 */
export const NAMED_PAGES: { slug: string; file: string; consumesCodes: string[] }[] = [
  { slug: "leak", file: "누수.md", consumesCodes: ["10"] },
  { slug: "condensation", file: "결로.md", consumesCodes: ["15"] },
  { slug: "crack", file: "균열.md", consumesCodes: ["7", "9"] },
  { slug: "malfunction", file: "기능불량.md", consumesCodes: [] },
  { slug: "detachment", file: "들뜸및탈락.md", consumesCodes: [] },
  { slug: "discoloration", file: "오염및변색.md", consumesCodes: [] },
];

const CONSUMED_CODES = new Set(NAMED_PAGES.flatMap((p) => p.consumesCodes));

const CONTENT_DIR = path.join(process.cwd(), "content", "defects");

export type DefectDoc = {
  slug: string;
  frontmatter: Record<string, unknown>;
  content: string;
};

export function getNamedPageDoc(slug: string): DefectDoc | null {
  const entry = NAMED_PAGES.find((p) => p.slug === slug);
  if (!entry) return null;
  const raw = readFileSync(path.join(CONTENT_DIR, entry.file), "utf-8");
  // 파일 맨 위 HTML 주석(작업 메모)은 화면에 노출할 내용이 아니므로 제거
  const withoutComment = raw.replace(/^<!--[\s\S]*?-->\s*/, "");
  const { data, content } = matter(withoutComment);
  return { slug, frontmatter: data, content };
}

export function getDefectByCode(code: string): DefectType | undefined {
  return defectTypes.find((t) => t.code === code);
}

/** 이 조문 코드가 이미 프로즈 페이지에 흡수됐다면 그 슬러그를, 아니면 null을 반환. */
export function getNamedSlugForCode(code: string): string | null {
  const entry = NAMED_PAGES.find((p) => p.consumesCodes.includes(code));
  return entry?.slug ?? null;
}

/** 조문 코드가 흡수되지 않은, 독립된 "/defect/{code}" 참조 페이지를 갖는지 여부. */
export function hasStandaloneArticlePage(code: string): boolean {
  return !CONSUMED_CODES.has(code);
}

/** "제22조" 같은 문자열에서 숫자만 추출해 링크 슬러그(이름 있는 페이지 우선)를 계산. */
export function resolveArticleLink(articleLabel: string): { slug: string; label: string } | null {
  const m = articleLabel.match(/(\d+)/);
  if (!m) return null;
  const code = m[1];
  const namedSlug = getNamedSlugForCode(code);
  return { slug: namedSlug ?? code, label: articleLabel };
}

export function getArticleText(code: string): string | null {
  return (articleTextData.articles as Record<string, string>)[code] ?? null;
}

/**
 * "제46조", "제46조(⑤항)", "제86조~제88조" 같은 참조 문자열에서 조문 번호를 전부 뽑는다.
 * "~"로 이어진 범위(예: 제86조~제88조)는 그 사이 번호까지 전부 펼친다.
 */
export function extractArticleNumbers(ref: string | null | undefined): string[] {
  if (!ref) return [];
  const nums = [...ref.matchAll(/제(\d+)조/g)].map((m) => Number(m[1]));
  if (ref.includes("~") && nums.length === 2) {
    const [a, b] = nums;
    if (b > a) return Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
  }
  return [...new Set(nums)].map(String);
}

export type ProcedureArticle = { number: string; text: string };

/** 조사방법·보수비용 참조 문자열(예: "제84조", "제86조~제88조")이 가리키는 조문 원문 전부를 가져온다. */
export function getProcedureArticleTexts(ref: string | null | undefined): ProcedureArticle[] {
  const articles = procedureArticleTextData.articles as Record<string, string>;
  return extractArticleNumbers(ref)
    .map((number) => ({ number, text: articles[number] }))
    .filter((a): a is ProcedureArticle => Boolean(a.text));
}

export type WarrantyCategoryInfo = { code: string; name: string; years: number } | null;

export function getWarrantyCategory(code: string | null): WarrantyCategoryInfo {
  if (!code) return null;
  const found = warrantyPeriods.categories.find((c) => c.code === code);
  return found ? { code: found.code, name: found.name, years: found.years } : null;
}

/** 현상(phenomenon) 이름 → 프로즈 페이지 슬러그. 오염및변색은 아직 프로즈 페이지가 없다(정직하게 null). */
export const PHENOMENON_SLUG: Record<string, string | null> = {
  기능불량: "malfunction",
  들뜸및탈락: "detachment",
  균열: "crack",
  결로: "condensation",
  누수: "leak",
  오염및변색: "discoloration",
};

/** 모든 정적 페이지 파라미터: 프로즈 슬러그 5개 + 흡수되지 않은 조문 코드들. */
export function getAllDefectSlugs(): string[] {
  const named = NAMED_PAGES.map((p) => p.slug);
  const standalone = defectTypes.map((t) => t.code).filter(hasStandaloneArticlePage);
  return [...named, ...standalone];
}

/**
 * 정보매칭 검색용 키워드 사전 — 조문 원문에 없는 일상어(증상 표현)를 조문 코드에 연결한다.
 * 조문 코드→일상어 방향으로만 추가한다(원문에 없는 사실을 새로 만들지 않기 위해, 판정 여부가 아니라
 * "이런 증상이면 이 조문이 관련 있을 수 있다"는 안내 목적으로만 쓴다).
 */
const EXTRA_KEYWORDS: Record<string, string[]> = {
  "10": ["물이 새요", "빗물", "젖음", "곰팡이"],
  "15": ["곰팡이", "물방울", "습기", "창문에 물이 맺혀요"],
  "18": ["타일 깨짐", "타일 들뜸", "타일 떨어짐"],
  "22": ["문이 안 닫혀요", "창문 뻑뻑함", "바람 새어 들어옴", "손잡이 없음", "문 뒤틀림"],
  "24": ["조명 고장", "전등 안 켜짐", "탄내", "스파크"],
  "25": ["에어컨 안 됨", "환풍기 고장", "후드 고장"],
  "26": ["난방 조절 안 됨", "보일러 온도조절 안 됨"],
  "27": ["수압 약함", "온수 안 뜨거움", "세면대 깨짐", "물 새요"],
  "28": ["인터폰 고장", "화면 안 나옴"],
  "29": ["CCTV 없음", "CCTV 고장"],
  "30": ["나무 죽음", "나무 말라죽음"],
  "34": ["벽지 들뜸", "벽지 주름", "도배 이음매"],
  "35": ["바닥 꺼짐", "바닥 삐걱거림", "바닥 단차"],
  "36": ["돌 들뜸", "대리석 균열"],
  "37": ["가구 흔들림", "수납장 문 안 닫힘", "가구 파손"],
  "38": ["동파", "배관 얼음"],
  "39": ["가전 고장", "가전 안 달림"],
  "40": ["엘리베이터 고장", "승강기 틈"],
  "42": ["주차장 바닥", "코너가드"],
};

export type DefectSearchItem = {
  code: string;
  slug: string;
  name: string;
  article: string;
  tags: string[];
  explanation: string;
  keywords: string;
};

/** /defect 페이지의 키워드 정보매칭 검색에 쓰는 색인. 판정하지 않고 관련 조문을 안내하는 용도. */
export function getDefectSearchIndex(): DefectSearchItem[] {
  return defectTypes.map((t) => ({
    code: t.code,
    slug: getNamedSlugForCode(t.code) ?? t.code,
    name: t.name,
    article: t.judgmentArticle,
    tags: t.phenomenonTags,
    explanation: t.plainExplanation ?? "",
    keywords: (EXTRA_KEYWORDS[t.code] ?? []).join(" "),
  }));
}
