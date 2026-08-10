#!/usr/bin/env node
// Phase 4 축② 상세 페이지용. raw/law/ 원문 텍스트에서 제7조~제44조(판정 조문) 전문을
// grep/파싱으로 그대로 추출한다 — 기억이나 요약으로 재작성하지 않고 원문 그대로 옮긴다.
// 산출물: data/defect-article-text.json ({ "7": "제7조(콘크리트 균열) ① ...", ... })

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LAW_DIR = path.join(ROOT, "raw", "law");
const OUT_FILE = path.join(ROOT, "data", "defect-article-text.json");

const sourceFile = readdirSync(LAW_DIR).find((f) => f.includes("하자판정기준"));
if (!sourceFile) {
  console.error("raw/law/ 에서 하자판정기준 원문 파일을 찾지 못했습니다.");
  process.exit(1);
}

const text = readFileSync(path.join(LAW_DIR, sourceFile), "utf-8");
const lines = text.split(/\r?\n/);

const ARTICLE_START = /^제(\d+)조(?:의\d+)? ?\(/;
const MIN_CODE = 7;
const MAX_CODE = 44;

const articles = {};
let currentCode = null;
let buffer = [];

function flush() {
  if (currentCode !== null && buffer.length > 0) {
    // 조문 끝의 불필요한 빈 줄만 정리, 내부 구조(항·호 들여쓰기)는 원문 그대로 유지
    const joined = buffer.join("\n").replace(/\n+$/, "");
    articles[currentCode] = joined;
  }
  buffer = [];
}

for (const line of lines) {
  const m = line.match(ARTICLE_START);
  if (m) {
    const code = Number(m[1]);
    flush();
    if (code >= MIN_CODE && code <= MAX_CODE) {
      currentCode = String(code);
      buffer.push(line);
    } else {
      currentCode = null;
    }
    continue;
  }
  if (currentCode !== null) {
    buffer.push(line);
  }
}
flush();

const foundCodes = Object.keys(articles)
  .map(Number)
  .sort((a, b) => a - b);
const expected = Array.from({ length: MAX_CODE - MIN_CODE + 1 }, (_, i) => i + MIN_CODE);
const missing = expected.filter((c) => !foundCodes.includes(c));

if (missing.length > 0) {
  console.error(`추출 실패 — 제${missing.join(",")}조 원문을 찾지 못했습니다. 원문 파일을 확인하세요.`);
  process.exit(1);
}

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      source: sourceFile,
      extractedAt: new Date().toISOString().slice(0, 10),
      note: "raw/law/ 원문 텍스트에서 제7조~제44조 전문을 그대로 추출함(요약·재작성 없음).",
      articles,
    },
    null,
    2,
  ) + "\n",
  "utf-8",
);

console.log(`제${MIN_CODE}조~제${MAX_CODE}조 전체 ${foundCodes.length}개 조문 추출 완료 → ${path.relative(ROOT, OUT_FILE)}`);
