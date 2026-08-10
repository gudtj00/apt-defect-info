// Phase 0-1 실사 전용 일회성 스크립트. 제품 코드 아님 — kaptBcompany/kaptUsedate 채움률 측정용.
import fs from "node:fs/promises";

const KEY_FILE = new URL("../.env", import.meta.url);
const envText = await fs.readFile(KEY_FILE, "utf8");
const rawKey = decodeURIComponent(
  envText.match(/DATA_GO_KR_SERVICE_KEY=(.+)/)[1].trim()
);

const LIST_BASE = "https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3";
const INFO_BASE = "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4";

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
      throw new Error(`Non-JSON response for ${url}: ${text.slice(0, 300)}`);
    }
    // data.go.kr 게이트웨이 레벨 에러(트래픽 초과 등)는 response가 아닌
    // OpenAPI_ServiceResponse.cmmMsgHeader 래퍼로 온다 — 별도 감지 필요.
    if (json.OpenAPI_ServiceResponse) {
      const errMsg = json.OpenAPI_ServiceResponse.cmmMsgHeader?.errMsg ?? "UNKNOWN_GATEWAY_ERROR";
      if (attempt === retries) throw new Error(`Gateway error after ${retries} retries: ${errMsg}`);
      await sleep(500 * (attempt + 1));
      continue;
    }
    const resultCode = json.response?.header?.resultCode;
    if (resultCode !== "00") {
      const resultMsg = json.response?.header?.resultMsg ?? "UNKNOWN";
      if (attempt === retries) throw new Error(`resultCode=${resultCode} (${resultMsg}) after ${retries} retries`);
      await sleep(500 * (attempt + 1));
      continue;
    }
    return json;
  }
}

// 1. totalCount 확인 후 페이지 전체에 고르게 스프레드해서 kaptCode 샘플 수집 (지역별 분포 확보 목적)
const first = await callApi(LIST_BASE, { pageNo: 1, numOfRows: 1 });
const totalCount = first.response.body.totalCount;
const numOfRows = 20;
const totalPages = Math.ceil(totalCount / numOfRows);
const TARGET_SAMPLES = 1200;
const step = Math.max(1, Math.floor(totalPages / (TARGET_SAMPLES / numOfRows)));

console.log(`전체 단지 수: ${totalCount}, 총 페이지: ${totalPages}, 페이지 스텝: ${step}`);

const samples = [];
const pageNos = [];
for (let p = 1; p <= totalPages && samples.length < TARGET_SAMPLES; p += step) {
  pageNos.push(p);
}

async function fetchListPage(pageNo) {
  try {
    const r = await callApi(LIST_BASE, { pageNo, numOfRows });
    const items = r.response?.body?.items ?? [];
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    console.error(`list page ${pageNo} 실패:`, e.message);
    return [];
  }
}

// 동시성 제한하며 목록 페이지 수집
const CONCURRENCY = 3;
let idx = 0;
async function worker() {
  while (idx < pageNos.length) {
    const myIdx = idx++;
    const items = await fetchListPage(pageNos[myIdx]);
    samples.push(...items);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`수집된 kaptCode 샘플 수: ${samples.length}`);
await fs.writeFile(
  new URL("../raw/kapt_sample_codes.json", import.meta.url),
  JSON.stringify(samples, null, 2)
);

// 2. 각 kaptCode에 대해 상세정보 조회 -> kaptBcompany/kaptUsedate 채움 여부 측정
const results = [];
let detailIdx = 0;
async function detailWorker() {
  while (detailIdx < samples.length) {
    const myIdx = detailIdx++;
    const s = samples[myIdx];
    try {
      const r = await callApi(INFO_BASE, { kaptCode: s.kaptCode });
      const item = r.response?.body?.item;
      results.push({
        kaptCode: s.kaptCode,
        kaptName: s.kaptName,
        as1: s.as1,
        kaptBcompany: item?.kaptBcompany ?? null,
        kaptUsedate: item?.kaptUsedate ?? null,
        resultCode: r.response?.header?.resultCode,
      });
    } catch (e) {
      results.push({ kaptCode: s.kaptCode, kaptName: s.kaptName, as1: s.as1, error: e.message });
    }
    if (myIdx % 100 === 0) console.log(`진행: ${myIdx}/${samples.length}`);
    await sleep(80);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, detailWorker));

await fs.writeFile(
  new URL("../raw/kapt_fillrate_raw.json", import.meta.url),
  JSON.stringify(results, null, 2)
);

// 3. 집계
function isEmpty(v) {
  return v === null || v === undefined || v === "" || v === "null";
}

const total = results.length;
const bcompanyFilled = results.filter((r) => !isEmpty(r.kaptBcompany)).length;
const usedateFilled = results.filter((r) => !isEmpty(r.kaptUsedate)).length;
const errors = results.filter((r) => r.error).length;

const byRegion = {};
for (const r of results) {
  const region = r.as1 || "미상";
  byRegion[region] ??= { total: 0, bcompanyFilled: 0, usedateFilled: 0 };
  byRegion[region].total++;
  if (!isEmpty(r.kaptBcompany)) byRegion[region].bcompanyFilled++;
  if (!isEmpty(r.kaptUsedate)) byRegion[region].usedateFilled++;
}

console.log("\n=== 전체 집계 ===");
console.log(`샘플 수: ${total} (API 오류: ${errors})`);
console.log(`kaptBcompany 채움률: ${((bcompanyFilled / total) * 100).toFixed(1)}% (${bcompanyFilled}/${total})`);
console.log(`kaptUsedate 채움률: ${((usedateFilled / total) * 100).toFixed(1)}% (${usedateFilled}/${total})`);

console.log("\n=== 지역별 채움률 ===");
for (const [region, stat] of Object.entries(byRegion).sort((a, b) => b[1].total - a[1].total)) {
  console.log(
    `${region}: 총 ${stat.total}건 / 시공사 ${((stat.bcompanyFilled / stat.total) * 100).toFixed(1)}% / 사용승인일 ${((stat.usedateFilled / stat.total) * 100).toFixed(1)}%`
  );
}

await fs.writeFile(
  new URL("../raw/kapt_fillrate_summary.json", import.meta.url),
  JSON.stringify({ total, bcompanyFilled, usedateFilled, errors, byRegion }, null, 2)
);
