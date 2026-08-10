// Phase 2 핵심 로직 — 단지별 담보책임기간 계산 엔진.
// 근거: data/warranty-periods.json (시행령 별표4 구조화본), 공동주택관리법 제36조③(기산점).
//
// 원칙(docs/data-sources.md, docs/phase1-legal-design.md 참고):
// - 틀린 계산 > 계산 안 함. kaptUsedate가 없거나 파싱 불가능하면 절대 추정하지 않고 "정보 없음"을 반환한다.
// - 공용부분은 사용승인일 기준 확정값이다. 전유부분은 기본적으로 사용승인일 기준 "추정치"(실제 인도일 아님)이지만,
//   사용자가 본인 세대의 실제 인도일을 입력하면 그 날짜를 기준으로 "확정값"으로 계산한다 — 입력값은 검증되지 않은
//   자기신고이므로 basisType으로 그 출처를 항상 구분해서 반환한다.
// - 10년 항목은 "내력구조부(주요구조부)"와 "지반공사"로 분리해서 표시한다 — 법적 근거가 서로 다르기 때문
//   (전자는 시행령 제36조①1호, 후자는 별표4 비고). 한때 2021-01-05 개정이 이 중 어느 하나를 실질적으로
//   바꿨을 가능성을 의심해 캐비엇을 붙였었으나, law.go.kr에서 개정 전 별표4 원본을 직접 확보해 대조한 결과
//   완전히 동일한 문구였음을 확인했다(캐비엇 제거). 근거: data/warranty-periods.json의 amendmentHistory20210105.

import warrantyPeriods from "../data/warranty-periods.json" with { type: "json" };

export type Part = "공용" | "전유";
export type WarrantyStatus = "active" | "expiring_soon" | "expired";
export type BasisType = "사용승인일(확정)" | "사용승인일 기준 추정치(전유부분 인도일 아님)" | "입력한 실제 인도일(확정, 자기신고)";

export interface WarrantyLineItem {
  categoryCode: string;
  categoryName: string;
  years: number;
  part: Part;
  basisDate: string; // YYYY-MM-DD
  basisType: BasisType;
  expiryDate: string; // YYYY-MM-DD
  remainingDays: number;
  status: WarrantyStatus;
  caveat?: string;
}

export type WarrantyResult =
  | {
      ok: true;
      usedate: string;
      items: WarrantyLineItem[];
      /** 사용자가 입력한 전유부분 실제 인도일이 유효해서 반영된 경우에만 존재. */
      jeonyuHandoverDate?: string;
      /** 사용자가 인도일을 입력했지만 형식이 잘못됐거나 사용승인일보다 빨라서 반영하지 못한 경우의 안내 메시지. */
      jeonyuHandoverDateError?: string;
    }
  | { ok: false; reason: "사용승인일 정보 없음" | "사용승인일 형식 오류" };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** kaptUsedate(YYYYMMDD)를 UTC 자정 기준 Date로 파싱한다. 유효하지 않으면 null. */
function parseKaptUsedate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d{8}$/.test(trimmed)) return null;

  const year = Number(trimmed.slice(0, 4));
  const month = Number(trimmed.slice(4, 6));
  const day = Number(trimmed.slice(6, 8));
  return buildValidUtcDate(year, month, day);
}

/** "YYYY-MM-DD" 형식(HTML date input)을 UTC 자정 기준 Date로 파싱한다. 유효하지 않으면 null. */
function parseIsoDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return buildValidUtcDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** 연/월/일이 실존하는 날짜인지 확인하고 UTC Date를 만든다. JS Date의 자동 롤오버(예: 2/30 → 3/2)를 거부한다. */
function buildValidUtcDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

/** UTC 날짜에 n년을 더한다. 2/29 + 비윤년 케이스는 2/28로 보정한다(더 보수적인 만료일). */
function addYearsUtc(date: Date, years: number): Date {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const candidate = new Date(Date.UTC(year, month, day));
  if (candidate.getUTCMonth() !== month) {
    // 2/29 → 대상 연도에 2/29가 없어 3/1로 롤오버된 경우.
    // Date.UTC(year, month + 1, 0)은 "month+1월의 0일" = "month월의 마지막 날"이 된다.
    return new Date(Date.UTC(year, month + 1, 0));
  }
  return candidate;
}

function formatUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function diffDaysUtc(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

const EXPIRING_SOON_THRESHOLD_DAYS = 90;

function statusOf(remainingDays: number): WarrantyStatus {
  if (remainingDays < 0) return "expired";
  if (remainingDays <= EXPIRING_SOON_THRESHOLD_DAYS) return "expiring_soon";
  return "active";
}

function buildLineItem(
  categoryCode: string,
  categoryName: string,
  years: number,
  part: Part,
  basisDate: Date,
  today: Date,
  options?: { caveat?: string; jeonyuIsActualHandover?: boolean }
): WarrantyLineItem {
  const expiry = addYearsUtc(basisDate, years);
  const remainingDays = diffDaysUtc(today, expiry);
  const basisType: BasisType =
    part === "공용"
      ? "사용승인일(확정)"
      : options?.jeonyuIsActualHandover
        ? "입력한 실제 인도일(확정, 자기신고)"
        : "사용승인일 기준 추정치(전유부분 인도일 아님)";
  return {
    categoryCode,
    categoryName,
    years,
    part,
    basisDate: formatUtc(basisDate),
    basisType,
    expiryDate: formatUtc(expiry),
    remainingDays,
    status: statusOf(remainingDays),
    caveat: options?.caveat,
  };
}

/**
 * 단지의 사용승인일을 입력받아 공종별 담보책임기간 잔여 현황을 계산한다.
 * @param kaptUsedate K-apt API의 kaptUsedate 필드값 (YYYYMMDD). 없거나 파싱 실패 시 계산하지 않는다.
 * @param today 기준일 (테스트 및 재현성을 위해 주입 가능). 기본값은 현재 UTC 날짜.
 * @param jeonyuHandoverDateRaw 사용자가 입력한 전유부분 실제 인도일 ("YYYY-MM-DD"). 있으면 전유부분 기산일로
 *   사용승인일 대신 이 날짜를 쓴다. 없거나 형식이 잘못됐거나 사용승인일보다 빠르면 기존처럼 사용승인일로 추정한다.
 */
export function calculateWarranty(
  kaptUsedate: string | null | undefined,
  today: Date = new Date(),
  jeonyuHandoverDateRaw?: string | null
): WarrantyResult {
  if (kaptUsedate === null || kaptUsedate === undefined || kaptUsedate.trim() === "") {
    return { ok: false, reason: "사용승인일 정보 없음" };
  }
  const basisDate = parseKaptUsedate(kaptUsedate);
  if (!basisDate) {
    return { ok: false, reason: "사용승인일 형식 오류" };
  }

  let jeonyuBasisDate = basisDate;
  let jeonyuHandoverDate: string | undefined;
  let jeonyuHandoverDateError: string | undefined;

  if (jeonyuHandoverDateRaw && jeonyuHandoverDateRaw.trim() !== "") {
    const parsed = parseIsoDate(jeonyuHandoverDateRaw);
    if (!parsed) {
      jeonyuHandoverDateError = "입력한 인도일 형식이 올바르지 않습니다. 날짜를 다시 선택해 주세요.";
    } else if (parsed.getTime() < basisDate.getTime()) {
      jeonyuHandoverDateError = "입력한 인도일이 사용승인일보다 빠릅니다 — 세대 인도는 사용승인일 이후에 이뤄지므로 날짜를 다시 확인해 주세요.";
    } else {
      jeonyuBasisDate = parsed;
      jeonyuHandoverDate = formatUtc(parsed);
    }
  }

  const items: WarrantyLineItem[] = [];
  const jeonyuOptions = { jeonyuIsActualHandover: Boolean(jeonyuHandoverDate) };

  for (const category of warrantyPeriods.categories) {
    items.push(buildLineItem(category.code, category.name, category.years, "공용", basisDate, today));
    items.push(buildLineItem(category.code, category.name, category.years, "전유", jeonyuBasisDate, today, jeonyuOptions));
  }

  for (const structural of warrantyPeriods.structuralCategories) {
    items.push(buildLineItem(structural.code, structural.name, structural.years, "공용", basisDate, today));
    items.push(
      buildLineItem(structural.code, structural.name, structural.years, "전유", jeonyuBasisDate, today, jeonyuOptions)
    );
  }

  return { ok: true, usedate: formatUtc(basisDate), items, jeonyuHandoverDate, jeonyuHandoverDateError };
}

export { parseKaptUsedate, parseIsoDate, addYearsUtc };
