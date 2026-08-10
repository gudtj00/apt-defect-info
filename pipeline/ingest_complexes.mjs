// 축① MVP용 데이터 적재 스크립트. Phase 0에서 만든 phase0_kapt_fillrate_check.mjs의
// 에러 감지(OpenAPI_ServiceResponse 게이트웨이 에러)+재시도+동시성 제한 로직을 그대로 재사용한다 —
// 그때 배운 교훈(동시성 8은 rate limit에 걸린다)을 다시 밟지 않기 위해서다.
//
// 두 가지 모드:
//   node ingest_complexes.mjs [샘플수]         — 샘플 모드(기존 동작). 전국에 고르게 퍼진 N건만 수집.
//   node ingest_complexes.mjs all [일일예산]    — 전체 모드. 22,260건 전체를 목표로 하되,
//     data.go.kr 개발계정 일일 한도(10,000건) 안에서 나눠 실행할 수 있도록 이어받기(resume)를 지원한다.
//     - 전체 단지 코드 목록은 최초 1회만 받아서 data/kapt-code-list.json에 캐시해두고,
//       그 다음부터는 재조회하지 않는다(목록 조회도 API 호출을 쓰므로 낭비하지 않기 위함).
//     - DB에 이미 있는 kaptCode는 건너뛰고, 아직 없는 것만 예산 한도까지 가져온다.
//     - 실행이 끝나면 남은 건수를 출력하므로, 다음 날 같은 명령을 다시 실행하면 이어서 받는다.
import fs from "node:fs/promises";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/db/schema.ts";
import { buildAptSlug } from "../lib/slug.ts";
import path from "node:path";

const envText = await fs.readFile(new URL("../.env", import.meta.url), "utf8");
const rawKey = decodeURIComponent(envText.match(/DATA_GO_KR_SERVICE_KEY=(.+)/)[1].trim());

const LIST_BASE = "https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3";
const INFO_BASE = "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4";
const CONCURRENCY = 3;
const CODE_LIST_CACHE = path.join(process.cwd(), "data", "kapt-code-list.json");

const mode = process.argv[2] ?? "300";
const isFullMode = mode === "all";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callApi(base, params, retries = 5) {
  const url = new URL(base);
  url.searchParams.set("serviceKey", rawKey);
  url.searchParams.set("_type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
    }
    if (json.OpenAPI_ServiceResponse) {
      if (attempt === retries) throw new Error(`Gateway error: ${json.OpenAPI_ServiceResponse.cmmMsgHeader?.errMsg}`);
      await sleep(500 * (attempt + 1));
      continue;
    }
    const resultCode = json.response?.header?.resultCode;
    if (resultCode !== "00") {
      if (attempt === retries) throw new Error(`resultCode=${resultCode}`);
      await sleep(500 * (attempt + 1));
      continue;
    }
    return json;
  }
}

async function fetchOrLoadFullCodeList() {
  try {
    const cached = JSON.parse(await fs.readFile(CODE_LIST_CACHE, "utf8"));
    console.log(`전체 단지 목록 캐시 사용: ${cached.length}건 (${CODE_LIST_CACHE})`);
    return cached;
  } catch {
    // 캐시 없음 — 최초 1회 전체 목록을 받는다. numOfRows=1000이 실제로 동작하는 것을
    // 사전에 라이브 호출로 확인했다(문서에 임의로 적지 않고 직접 검증함).
    console.log("전체 단지 목록 캐시 없음 — 최초 수집 시작");
    const numOfRows = 1000;
    const first = await callApi(LIST_BASE, { pageNo: 1, numOfRows: 1 });
    const totalCount = first.response.body.totalCount;
    const totalPages = Math.ceil(totalCount / numOfRows);
    console.log(`전체 단지 수: ${totalCount} (목록 조회 ${totalPages}회 예정)`);

    const list = [];
    for (let p = 1; p <= totalPages; p++) {
      const r = await callApi(LIST_BASE, { pageNo: p, numOfRows });
      const items = r.response?.body?.items ?? [];
      list.push(...(Array.isArray(items) ? items : [items]));
      await sleep(80);
    }
    await fs.writeFile(CODE_LIST_CACHE, JSON.stringify(list, null, 2), "utf8");
    console.log(`전체 단지 목록 수집 완료: ${list.length}건 → ${CODE_LIST_CACHE}에 캐시`);
    return list;
  }
}

async function fetchSampleCodeList(targetSamples) {
  const numOfRows = 20;
  const first = await callApi(LIST_BASE, { pageNo: 1, numOfRows: 1 });
  const totalCount = first.response.body.totalCount;
  const totalPages = Math.ceil(totalCount / numOfRows);
  const step = Math.max(1, Math.floor(totalPages / (targetSamples / numOfRows)));

  console.log(`전체 단지 수: ${totalCount}, 목표 샘플: ${targetSamples}, 페이지 스텝: ${step}`);

  const pageNos = [];
  for (let p = 1; p <= totalPages && pageNos.length * numOfRows < targetSamples; p += step) pageNos.push(p);

  const samples = [];
  let idx = 0;
  async function worker() {
    while (idx < pageNos.length) {
      const myIdx = idx++;
      try {
        const r = await callApi(LIST_BASE, { pageNo: pageNos[myIdx], numOfRows });
        const items = r.response?.body?.items ?? [];
        samples.push(...(Array.isArray(items) ? items : [items]));
      } catch (e) {
        console.error(`목록 페이지 ${pageNos[myIdx]} 실패: ${e.message}`);
      }
      await sleep(80);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`수집된 단지 코드: ${samples.length}건`);
  return samples;
}

const dbPath = path.join(process.cwd(), "data", "apt-defect.sqlite");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

let candidates;
if (isFullMode) {
  const budget = Number(process.argv[3] ?? 9000);
  const fullList = await fetchOrLoadFullCodeList();

  const existing = new Set(db.select({ kaptCode: schema.complexes.kaptCode }).from(schema.complexes).all().map((r) => r.kaptCode));
  const remaining = fullList.filter((s) => !existing.has(s.kaptCode));
  console.log(`전체 ${fullList.length}건 중 이미 적재됨 ${existing.size}건, 남음 ${remaining.length}건`);

  candidates = remaining.slice(0, budget);
  console.log(`이번 실행 목표: ${candidates.length}건 (예산 ${budget}건)`);
} else {
  candidates = await fetchSampleCodeList(Number(mode));
}

const rows = [];
{
  let idx = 0;
  async function worker() {
    while (idx < candidates.length) {
      const myIdx = idx++;
      const s = candidates[myIdx];
      try {
        const r = await callApi(INFO_BASE, { kaptCode: s.kaptCode });
        const item = r.response?.body?.item;
        const name = item?.kaptName ?? s.kaptName;
        const region = s.as1 ?? null;
        const row = {
          kaptCode: s.kaptCode,
          slug: buildAptSlug(region, name, s.kaptCode),
          name,
          region,
          address: item?.kaptAddr ?? null,
          roadAddress: item?.doroJuso ?? null,
          usedate: item?.kaptUsedate || null,
          householdCount: item?.kaptdaCnt != null ? Math.round(item.kaptdaCnt) : null,
          dongCount: item?.kaptDongCnt != null ? Number(item.kaptDongCnt) : null,
          builderName: item?.kaptBcompany?.trim() || null,
          saleType: item?.codeSaleNm ?? null,
          fetchedAt: new Date().toISOString(),
        };
        // 받는 즉시 DB에 반영한다 — 예산을 다 못 쓰고 중단되더라도 이미 받은 만큼은 남아서,
        // 다음 실행 때 "이미 적재된 kaptCode"로 걸러져 이중 소모되지 않는다.
        db.insert(schema.complexes).values(row).onConflictDoUpdate({ target: schema.complexes.kaptCode, set: row }).run();
        rows.push(row);
      } catch (e) {
        console.error(`${s.kaptCode} 상세조회 실패: ${e.message}`);
      }
      if (myIdx % 50 === 0) console.log(`상세조회 진행: ${myIdx}/${candidates.length}`);
      await sleep(80);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

console.log(`\nDB에 저장 완료: ${rows.length}건 (${dbPath})`);

if (isFullMode) {
  const totalNow = db.select({ kaptCode: schema.complexes.kaptCode }).from(schema.complexes).all().length;
  const fullList = JSON.parse(await fs.readFile(CODE_LIST_CACHE, "utf8"));
  const stillRemaining = fullList.length - totalNow;
  console.log(`누적 적재: ${totalNow}/${fullList.length}건, 남음: ${stillRemaining}건`);
  if (stillRemaining > 0) {
    console.log(`내일 같은 명령(node pipeline/ingest_complexes.mjs all)을 다시 실행하면 이어서 받습니다.`);
  } else {
    console.log(`전체 적재 완료.`);
  }
}
