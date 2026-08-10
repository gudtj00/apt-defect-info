#!/usr/bin/env node
// 금지어 lint — Phase 1 법적 설계. 대법원 2022도699 판결의 유죄 사유(사적 제재 성격)를
// 코드로 차단하기 위한 CI 게이트. 실패 시 exit code 1로 빌드를 막는다.
//
// 두 그룹으로 나눠서 검사한다 (docs/phase1-legal-design.md 참고):
//  - ALWAYS: 사이트 전체에서 무조건 금지. 법령 원문에 등장하지 않는 순수 평가어.
//  - BUILDER_SCOPED: 건설사 지목 콘텐츠(/builder, /rank 등)에서만 금지.
//    "불량"·"위험" 등은 하자판정기준 고시 원문의 정식 용어(작동불량·기능불량 등)이므로
//    하자 유형 사전처럼 법령을 인용하는 콘텐츠에서 차단하면 안 된다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_EXTENSIONS = new Set([".tsx", ".jsx", ".ts", ".js", ".md", ".mdx"]);
const SCAN_DIRS = ["app", "components", "content", "lib"]; // 존재하지 않으면 건너뜀
const IGNORE_DIR_NAMES = new Set(["node_modules", ".next", ".git", ".vercel"]);
// 금지어 자체를 배열 리터럴로 정의하는 파일은 스캔 대상에서 제외한다.
// (이 파일들이 스스로를 린트하면 정의 목적으로 나열한 단어가 매번 걸린다.)
const IGNORE_FILE_BASENAMES = new Set([
  "legal-constants.ts",
  "legal-lint.mjs",
  "legal-lint.test.mjs",
]);

const BANNED_WORDS_ALWAYS = ["최악", "엉터리", "피하세요", "주의하세요", "블랙리스트"];
const BANNED_WORDS_BUILDER_SCOPED = ["부실", "불량", "위험", "조심"];
const BUILDER_SCOPED_PATH_MARKERS = [
  `${path.sep}builder${path.sep}`,
  `${path.sep}rank${path.sep}`,
  `content${path.sep}builders`,
  "Builder",
];

export function isBuilderScoped(filePath) {
  return BUILDER_SCOPED_PATH_MARKERS.some((marker) => filePath.includes(marker));
}

export function checkLine(line, filePath) {
  const wordsToCheck = isBuilderScoped(filePath)
    ? [...BANNED_WORDS_ALWAYS, ...BANNED_WORDS_BUILDER_SCOPED]
    : BANNED_WORDS_ALWAYS;
  return wordsToCheck.filter((word) => line.includes(word));
}

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files; // 디렉터리가 아직 없으면 건너뜀 (Phase 4 이전엔 app/ 등이 없을 수 있음)
  }
  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry)) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry)) && !IGNORE_FILE_BASENAMES.has(entry)) {
      files.push(full);
    }
  }
  return files;
}

export function lintFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const violations = [];
  lines.forEach((line, i) => {
    for (const word of checkLine(line, filePath)) {
      violations.push({ line: i + 1, word, text: line.trim() });
    }
  });
  return violations;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  let targetFiles = [];
  for (const dir of SCAN_DIRS) {
    targetFiles = targetFiles.concat(walk(path.join(ROOT, dir)));
  }

  let totalViolations = 0;
  for (const file of targetFiles) {
    const violations = lintFile(file);
    if (violations.length > 0) {
      totalViolations += violations.length;
      const rel = path.relative(ROOT, file);
      console.error(`\n${rel}`);
      for (const v of violations) {
        console.error(`  ${v.line}: "${v.word}" 발견 → ${v.text}`);
      }
    }
  }

  console.log(`\n검사한 파일 수: ${targetFiles.length}`);
  if (totalViolations > 0) {
    console.error(`\n금지어 ${totalViolations}건 발견. 빌드를 중단합니다.`);
    console.error(
      "건설사 관련 페이지(/builder, /rank)라면 '부실/불량/위험/조심'은 판정 결과의 사실 서술로만 쓸 수 있는지 확인하세요."
    );
    process.exit(1);
  } else {
    console.log("금지어 없음. 통과.");
  }
}
