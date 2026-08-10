// 계산 엔진 검증 테스트 (Phase 2 필수 요구사항: "알려진 단지 몇 개를 손으로 계산한 값과 대조").
// 실행: node lib/warranty-calc.test.ts (Node 24 네이티브 TS 지원 사용, 별도 빌드 도구 불필요)
import assert from "node:assert/strict";
import { calculateWarranty } from "./warranty-calc.ts";

const FIXED_TODAY = new Date(Date.UTC(2026, 7, 4)); // 2026-08-04, 세션 진행 시점과 동일하게 고정

let passed = 0;
let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL: ${name}`);
    console.error(`  ${(e as Error).message}`);
  }
}

// --- 손 계산 대조 케이스 1: 실제 K-apt 데이터, Phase 0 실사에서 확인한 단지 ---
// 고덕센트럴 아이파크 (강동구), kaptUsedate=20191230 (Phase 0 raw 응답에서 확인)
// 12/30은 2월을 지나지 않으므로 N년 후 = 그대로 월/일 유지. 손 계산:
//   2년 만료 2021-12-30, 3년 만료 2022-12-30, 5년 만료 2024-12-30, 10년 만료 2029-12-30
// 기준일 2026-08-04 기준: 2/3/5년 전부 이미 만료, 10년만 아직 유효(잔여일수 = 2029-12-30 - 2026-08-04)
check("고덕센트럴아이파크(20191230) — 2년 마감공사는 만료 상태", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const item = result.items.find((i) => i.categoryCode === "1" && i.part === "공용");
  assert.ok(item);
  assert.equal(item!.expiryDate, "2021-12-30");
  assert.equal(item!.status, "expired");
});

check("고덕센트럴아이파크(20191230) — 10년 내력구조부는 아직 유효, 잔여일수 손계산 일치", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const item = result.items.find((i) => i.categoryCode === "structural-10y" && i.part === "공용");
  assert.ok(item);
  assert.equal(item!.expiryDate, "2029-12-30");
  assert.equal(item!.status, "active");
  // 2026-08-04 → 2029-12-30 직접 계산: 2026년 잔여(8/4~12/31=149일... 아래 별도 검증)
  const expected = Math.round(
    (Date.UTC(2029, 11, 30) - Date.UTC(2026, 7, 4)) / 86400000
  );
  assert.equal(item!.remainingDays, expected);
});

check("고덕센트럴아이파크 — 내력구조부·지반공사 둘 다 캐비엇 없음 (2021-01-05 개정이 실질 변경이 아님을 확인함)", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  if (!result.ok) return;
  const structural = result.items.find((i) => i.categoryCode === "structural-10y" && i.part === "공용");
  const groundwork = result.items.find((i) => i.categoryCode === "groundwork-10y" && i.part === "공용");
  assert.ok(!structural!.caveat);
  assert.ok(!groundwork!.caveat);
});

check("지반공사(groundwork-10y)도 내력구조부와 동일하게 10년 계산됨", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const item = result.items.find((i) => i.categoryCode === "groundwork-10y" && i.part === "공용");
  assert.ok(item);
  assert.equal(item!.years, 10);
  assert.equal(item!.expiryDate, "2029-12-30");
});

// --- 손 계산 대조 케이스 2: 오래된 단지, 전부 만료 ---
// 호반청암빌라트 (광주), kaptUsedate=19931130 (Phase 0 raw 응답에서 확인)
check("호반청암빌라트(19931130) — 모든 공종이 만료 상태(1993년 준공)", () => {
  const result = calculateWarranty("19931130", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  for (const item of result.items) {
    assert.equal(item.status, "expired", `${item.categoryName}(${item.part})이 만료 상태가 아님`);
  }
});

check("호반청암빌라트(1993년 준공, 룰 개정일 훨씬 이전)도 캐비엇 없음", () => {
  const result = calculateWarranty("19931130", FIXED_TODAY);
  if (!result.ok) return;
  const item = result.items.find((i) => i.categoryCode === "structural-10y" && i.part === "공용");
  assert.ok(!item!.caveat);
});

// --- 경계 케이스: 만료 임박(90일 이내) ---
check("만료 90일 이내 단지는 expiring_soon 상태 (손계산: 2024-09-01 + 2년 = 2026-09-01, 기준일과 28일 차)", () => {
  const result = calculateWarranty("20240901", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const item = result.items.find((i) => i.categoryCode === "1" && i.part === "공용");
  assert.equal(item!.expiryDate, "2026-09-01");
  assert.equal(item!.remainingDays, 28);
  assert.equal(item!.status, "expiring_soon");
});

// --- 경계 케이스: 정보 없음 처리 (추정 금지 원칙) ---
check("kaptUsedate가 null이면 계산하지 않고 정보 없음 반환", () => {
  const result = calculateWarranty(null, FIXED_TODAY);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "사용승인일 정보 없음");
});

check("kaptUsedate가 빈 문자열이면 계산하지 않는다", () => {
  const result = calculateWarranty("", FIXED_TODAY);
  assert.equal(result.ok, false);
});

check("kaptUsedate 형식이 잘못되면(자릿수 오류) 계산하지 않는다", () => {
  const result = calculateWarranty("2019-12-30", FIXED_TODAY);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "사용승인일 형식 오류");
});

check("kaptUsedate가 존재하지 않는 날짜(13월)면 계산하지 않는다", () => {
  const result = calculateWarranty("20191330", FIXED_TODAY);
  assert.equal(result.ok, false);
});

check("kaptUsedate가 존재하지 않는 날짜(2/30)면 계산하지 않는다 — 롤오버로 3/2가 되는 것을 거부해야 함", () => {
  const result = calculateWarranty("20230230", FIXED_TODAY);
  assert.equal(result.ok, false);
});

// --- 윤년 경계 케이스 ---
check("윤년 2/29 준공 + 1년(비윤년) → 2/28로 보정", () => {
  // addYearsUtc를 직접 검증하기보다 구조공사(10년, 비윤년 배수 아닌 경우)로 간접 확인하는 대신
  // 2년 카테고리로 직접 확인: 2020-02-29 + 2년 = 2022-02-28 (2022는 비윤년)
  const result = calculateWarranty("20200229", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const item = result.items.find((i) => i.categoryCode === "1" && i.part === "공용");
  assert.equal(item!.expiryDate, "2022-02-28");
});

// --- 공용/전유 구분 확인 ---
check("같은 카테고리라도 공용/전유의 basisType 라벨이 다르다", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  if (!result.ok) return;
  const gongyong = result.items.find((i) => i.categoryCode === "1" && i.part === "공용");
  const jeonyu = result.items.find((i) => i.categoryCode === "1" && i.part === "전유");
  assert.equal(gongyong!.basisType, "사용승인일(확정)");
  assert.equal(jeonyu!.basisType, "사용승인일 기준 추정치(전유부분 인도일 아님)");
  // 기준일 자체는 동일(전유 인도일을 모르므로 사용승인일로 대체 추정)
  assert.equal(gongyong!.basisDate, jeonyu!.basisDate);
});

check("21개 시설공사 + 내력구조부(10년) + 지반공사(10년) = 23개 카테고리 × 공용/전유 2개 = 46개 항목", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  if (!result.ok) return;
  assert.equal(result.items.length, 46);
});

// --- 전유부분 실제 인도일 입력 기능 ---
check("전유부분 인도일을 입력하면 그 날짜 기준으로 확정값이 계산된다", () => {
  // 사용승인일 2019-12-30, 실제 인도일 2020-03-15(사용승인일보다 늦음, 흔한 케이스)
  const result = calculateWarranty("20191230", FIXED_TODAY, "2020-03-15");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.jeonyuHandoverDate, "2020-03-15");
  assert.equal(result.jeonyuHandoverDateError, undefined);
  const gongyong = result.items.find((i) => i.categoryCode === "1" && i.part === "공용");
  const jeonyu = result.items.find((i) => i.categoryCode === "1" && i.part === "전유");
  assert.equal(gongyong!.basisDate, "2019-12-30", "공용부분은 인도일 입력과 무관하게 사용승인일 그대로");
  assert.equal(jeonyu!.basisDate, "2020-03-15");
  assert.equal(jeonyu!.expiryDate, "2022-03-15", "2년 마감공사: 2020-03-15 + 2년");
  assert.equal(jeonyu!.basisType, "입력한 실제 인도일(확정, 자기신고)");
});

check("전유부분 인도일 형식이 잘못되면 무시하고 기존처럼 추정치로 계산하되 에러 메시지를 반환한다", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY, "2020/03/15");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.jeonyuHandoverDate, undefined);
  assert.ok(result.jeonyuHandoverDateError);
  const jeonyu = result.items.find((i) => i.categoryCode === "1" && i.part === "전유");
  assert.equal(jeonyu!.basisType, "사용승인일 기준 추정치(전유부분 인도일 아님)");
});

check("전유부분 인도일이 사용승인일보다 빠르면 거부하고 추정치로 계산한다", () => {
  // 사용승인일 2019-12-30보다 빠른 2019-01-01은 논리적으로 불가능(준공 전 인도 불가) — 거부해야 함
  const result = calculateWarranty("20191230", FIXED_TODAY, "2019-01-01");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.jeonyuHandoverDate, undefined);
  assert.ok(result.jeonyuHandoverDateError);
  const jeonyu = result.items.find((i) => i.categoryCode === "1" && i.part === "전유");
  assert.equal(jeonyu!.basisType, "사용승인일 기준 추정치(전유부분 인도일 아님)");
});

check("전유부분 인도일을 입력하지 않으면 기존과 동일하게 동작한다(하위호환)", () => {
  const result = calculateWarranty("20191230", FIXED_TODAY);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.jeonyuHandoverDate, undefined);
  assert.equal(result.jeonyuHandoverDateError, undefined);
});

console.log(`\n${passed}건 통과, ${failed}건 실패`);
if (failed > 0) process.exit(1);
