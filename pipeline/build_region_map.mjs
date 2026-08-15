/**
 * 시도 경계 → 지역 선택기용 정적 SVG path 생성
 *
 * 소스: Natural Earth 10m admin-1 (ne_10m_admin_1_states_provinces.geojson)
 *       퍼블릭 도메인. "No permission is needed to use Natural Earth."
 *       https://www.naturalearthdata.com/about/terms-of-use/
 *
 * 이 스크립트는 한 번 돌려서 data/region-map.json 을 만들고 끝난다.
 * 런타임에는 결과 JSON만 쓰므로 지도 라이브러리도, 외부 요청도 없다.
 *
 * 핵심 처리: 광주 + 전남 병합
 *   「전남광주통합특별시 설치를 위한 특별법」(2026-07-01 시행)으로 두 지역이
 *   하나가 됐다. Natural Earth는 통합 이전 기준이라 둘이 따로 있다.
 *   다행히 전남 폴리곤은 광주 자리를 '구멍'으로 갖고 있고 그 구멍의 좌표가
 *   광주 폴리곤과 같다. 그래서 구멍을 지우는 것만으로 정확히 병합된다.
 *   (좌표 일치는 아래에서 실제로 검사하고, 어긋나면 중단한다.)
 *
 * 사용법: node pipeline/build_region_map.mjs <ne10.geojson 경로>
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SRC = process.argv[2];
if (!SRC) {
  console.error("사용법: node pipeline/build_region_map.mjs <ne_10m_admin_1_states_provinces.geojson>");
  process.exit(1);
}

const OUT = path.join(process.cwd(), "data", "region-map.json");
const DB_PATH = path.join(process.cwd(), "data", "apt-defect.sqlite");

/** Natural Earth의 시도명(영문) → DB의 region 문자열.
 *  DB 값이 기준이다. 강원·전북은 특별자치도로 바뀐 이름을 쓴다. */
const NAME_MAP = {
  Seoul: "서울특별시",
  Busan: "부산광역시",
  Daegu: "대구광역시",
  Incheon: "인천광역시",
  Daejeon: "대전광역시",
  Ulsan: "울산광역시",
  Sejong: "세종특별자치시",
  Gyeonggi: "경기도",
  Gangwon: "강원특별자치도",
  "North Chungcheong": "충청북도",
  "South Chungcheong": "충청남도",
  "North Jeolla": "전북특별자치도",
  "South Jeolla": "전남광주통합특별시", // 광주 병합 후 이름
  "North Gyeongsang": "경상북도",
  "South Gyeongsang": "경상남도",
  Jeju: "제주특별자치도",
};
const MERGED_INTO_JEONNAM = "Gwangju";

const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
const kr = raw.features.filter((f) => f.properties.adm0_a3 === "KOR");
if (kr.length === 0) throw new Error("원본에서 한국(KOR) feature를 찾지 못했습니다.");

const byName = new Map(kr.map((f) => [f.properties.name, f]));
const toPolys = (f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);

// ── 1. 광주 병합: 전남에서 광주 구멍을 찾아 제거한다 ──────────────────────
const jeonnam = byName.get("South Jeolla");
const gwangju = byName.get(MERGED_INTO_JEONNAM);
if (!jeonnam || !gwangju) throw new Error("전남 또는 광주 feature가 없습니다.");

const bboxOf = (ring) => {
  let x1 = 180, y1 = 90, x2 = -180, y2 = -90;
  for (const [x, y] of ring) {
    if (x < x1) x1 = x;
    if (x > x2) x2 = x;
    if (y < y1) y1 = y;
    if (y > y2) y2 = y;
  }
  return [x1, y1, x2, y2];
};
const gwangjuOuter = toPolys(gwangju)[0][0];
const gBox = bboxOf(gwangjuOuter);

let removed = 0;
const jeonnamPolys = toPolys(jeonnam).map((poly) => {
  const kept = [poly[0]];
  for (const hole of poly.slice(1)) {
    const hBox = bboxOf(hole);
    const same = hBox.every((v, i) => Math.abs(v - gBox[i]) < 1e-6);
    if (same) {
      removed++;
      continue; // 이 구멍이 광주다. 메운다.
    }
    kept.push(hole);
  }
  return kept;
});

if (removed !== 1) {
  throw new Error(
    `광주에 해당하는 구멍을 정확히 1개 찾지 못했습니다(찾은 개수: ${removed}). ` +
      `원본 데이터 구조가 바뀌었을 수 있으니 병합 방식을 다시 확인해야 합니다.`,
  );
}
console.log(`[병합] 전남 폴리곤에서 광주 구멍 1개 제거 → 전남광주통합특별시`);

// ── 2. 지역별 폴리곤 수집 ────────────────────────────────────────────────
const regions = [];
for (const [neName, dbName] of Object.entries(NAME_MAP)) {
  const f = byName.get(neName);
  if (!f) throw new Error(`Natural Earth에 '${neName}'가 없습니다.`);
  regions.push({ dbName, polys: neName === "South Jeolla" ? jeonnamPolys : toPolys(f) });
}

// ── 3. 투영 ─────────────────────────────────────────────────────────────
// 한국처럼 좁은 범위는 등장방형에 경도만 cos(위도)로 눌러주면 충분하다.
// (웹메르카토르를 써도 이 위도대에서 눈에 띄는 차이가 없다.)
let LON1 = 180, LAT1 = 90, LON2 = -180, LAT2 = -90;
for (const r of regions)
  for (const poly of r.polys)
    for (const [x, y] of poly[0]) {
      if (x < LON1) LON1 = x;
      if (x > LON2) LON2 = x;
      if (y < LAT1) LAT1 = y;
      if (y > LAT2) LAT2 = y;
    }
const MEAN_LAT = ((LAT1 + LAT2) / 2) * (Math.PI / 180);
const KX = Math.cos(MEAN_LAT);

const WIDTH = 1000;
const spanX = (LON2 - LON1) * KX;
const spanY = LAT2 - LAT1;
const SCALE = WIDTH / spanX;
const HEIGHT = Math.round(spanY * SCALE);
const project = ([lon, lat]) => [
  (lon - LON1) * KX * SCALE,
  (LAT2 - lat) * SCALE, // 화면 y는 아래로 증가
];

// ── 4. 단순화 (Douglas-Peucker) ─────────────────────────────────────────
function simplify(points, tol) {
  if (points.length <= 3) return points;
  const sqTol = tol * tol;
  const sqSegDist = (p, a, b) => {
    let [x, y] = a;
    let dx = b[0] - x, dy = b[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) [x, y] = b;
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p[0] - x; dy = p[1] - y;
    return dx * dx + dy * dy;
  };
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = sqSegDist(points[i], points[first], points[last]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > sqTol && idx > 0) {
      keep[idx] = 1;
      stack.push([first, idx], [idx, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const ringArea = (pts) => {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++)
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
};

const TOL = 0.6;        // px. 1000px 폭 기준
const MIN_AREA = 1.5;   // px². 이보다 작은 섬은 렌더해도 안 보인다.

const round = (n) => Math.round(n * 10) / 10;
let droppedIslands = 0;

const out = regions.map(({ dbName, polys }) => {
  const subpaths = [];
  let biggest = null, biggestArea = 0;

  for (const poly of polys) {
    for (const ring of poly) {
      const projected = ring.map(project);
      const simplified = simplify(projected, TOL);
      if (simplified.length < 4) { droppedIslands++; continue; }
      const area = ringArea(simplified);
      if (area < MIN_AREA) { droppedIslands++; continue; }
      if (area > biggestArea) { biggestArea = area; biggest = simplified; }
      subpaths.push(
        "M" + simplified.map(([x, y]) => `${round(x)},${round(y)}`).join("L") + "Z",
      );
    }
  }

  // 라벨 위치는 가장 큰 링의 무게중심. 오목한 모양에서 밖으로 나가는 걸 막으려고
  // 링 정점 평균이 아니라 폴리곤 중심(centroid)을 쓴다.
  let cx = 0, cy = 0, a = 0;
  for (let i = 0, j = biggest.length - 1; i < biggest.length; j = i++) {
    const f = biggest[j][0] * biggest[i][1] - biggest[i][0] * biggest[j][1];
    a += f;
    cx += (biggest[j][0] + biggest[i][0]) * f;
    cy += (biggest[j][1] + biggest[i][1]) * f;
  }
  a *= 0.5;
  const label = a === 0 ? biggest[0] : [cx / (6 * a), cy / (6 * a)];

  return { region: dbName, d: subpaths.join(""), labelX: round(label[0]), labelY: round(label[1]) };
});

// ── 5. DB의 region 값과 대조 ────────────────────────────────────────────
const db = new Database(DB_PATH, { readonly: true });
const rows = db.prepare("SELECT region, COUNT(*) n FROM complexes GROUP BY region").all();
db.close();
const counts = new Map(rows.map((r) => [r.region, r.n]));

const missingInDb = out.map((o) => o.region).filter((r) => !counts.has(r));
const missingInMap = [...counts.keys()].filter((r) => !out.some((o) => o.region === r));
if (missingInDb.length || missingInMap.length) {
  throw new Error(
    `지역명이 DB와 맞지 않습니다.\n  지도에만 있음: ${missingInDb.join(", ") || "없음"}` +
      `\n  DB에만 있음: ${missingInMap.join(", ") || "없음"}`,
  );
}

for (const o of out) o.count = counts.get(o.region);
out.sort((a, b) => b.count - a.count);

const payload = {
  source: "Natural Earth 10m admin-1 (public domain, naturalearthdata.com)",
  note: "광주광역시는 전남광주통합특별시로 병합됨 (전남광주통합특별시 설치를 위한 특별법, 2026-07-01 시행)",
  viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
  regions: out,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload));

console.log(`[투영] viewBox 0 0 ${WIDTH} ${HEIGHT} (경도 ${LON1.toFixed(2)}~${LON2.toFixed(2)}, 위도 ${LAT1.toFixed(2)}~${LAT2.toFixed(2)})`);
console.log(`[단순화] 허용오차 ${TOL}px, 최소면적 ${MIN_AREA}px² → 작은 섬 ${droppedIslands}개 생략`);
console.log(`[대조] 지역 ${out.length}개 전부 DB region 값과 일치`);
console.log(`[출력] ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
for (const o of out) console.log(`   ${o.region.padEnd(12)} ${String(o.count).padStart(5)}개  path ${o.d.length}자`);
