// legal-lint.mjs의 핵심 판단 로직(문맥 구분)이 실제로 의도대로 동작하는지 확인하는 회귀 테스트.
// 실행: node scripts/legal-lint.test.mjs
import assert from "node:assert/strict";
import path from "node:path";
import { checkLine, isBuilderScoped } from "./legal-lint.mjs";

const cases = [
  {
    name: "하자 유형 사전(법령 인용)은 '불량'을 포함해도 통과해야 한다",
    line: "환풍기, 에어컨, 후드 등의 작동·기능불량이 발생한 경우에는 시공하자로 본다.",
    filePath: path.join("content", "defects", "공기조화-냉방설비.md"),
    expectViolations: [],
  },
  {
    name: "건설사 페이지(/builder)에서 '불량'을 건설사 평가에 쓰면 차단해야 한다",
    line: "이 건설사는 시공 품질이 불량한 것으로 알려져 있습니다.",
    filePath: path.join("app", "builder", "[slug]", "page.tsx"),
    expectViolations: ["불량"],
  },
  {
    name: "건설사 페이지에서도 사실 서술(판정 건수)은 그 자체로 '불량' 단어가 없으면 통과",
    line: "국토교통부 하자 판정 건수 12건 (2026년 상반기 공표)",
    filePath: path.join("app", "builder", "[slug]", "page.tsx"),
    expectViolations: [],
  },
  {
    name: "ALWAYS 금지어는 위치 무관하게 항상 차단 (하자 유형 사전이라도)",
    line: "이 시공사는 최악입니다.",
    filePath: path.join("content", "defects", "무관한-페이지.md"),
    expectViolations: ["최악"],
  },
  {
    name: "랭킹 페이지(/rank)에서 '주의하세요'류 표현 차단",
    line: "이 건설사는 피하세요.",
    filePath: path.join("app", "rank", "2026-1", "page.tsx"),
    expectViolations: ["피하세요"],
  },
  {
    name: "일반 콘텐츠에서 'BUILDER_SCOPED' 단어(조심)는 통과",
    line: "결로 발생 부위는 육안조사 시 조심스럽게 접근한다.", // 실제 법령 표현은 아니지만 일반 콘텐츠 예시
    filePath: path.join("content", "guide", "결로.md"),
    expectViolations: [],
  },
];

let failed = 0;
for (const c of cases) {
  const result = checkLine(c.line, c.filePath);
  try {
    assert.deepEqual(result.sort(), c.expectViolations.sort());
    console.log(`PASS: ${c.name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL: ${c.name}`);
    console.error(`  기대: ${JSON.stringify(c.expectViolations)}, 실제: ${JSON.stringify(result)}`);
  }
}

// isBuilderScoped 경계 케이스
assert.equal(isBuilderScoped(path.join("app", "builder", "page.tsx")), true);
assert.equal(isBuilderScoped(path.join("content", "defects", "균열.md")), false);
console.log("PASS: isBuilderScoped 경계 케이스");

if (failed > 0) {
  console.error(`\n${failed}건 실패`);
  process.exit(1);
}
console.log("\n전체 통과");
