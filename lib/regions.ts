import regionMap from "@/data/region-map.json";

/**
 * 시도 경계 데이터.
 *
 * pipeline/build_region_map.mjs 가 Natural Earth(퍼블릭 도메인)에서 한 번 구워낸 결과다.
 * 런타임에는 이 JSON만 읽으므로 지도 라이브러리도, 외부 요청도 없다.
 *
 * 지역명은 DB의 complexes.region 과 같은 문자열이며, 생성 스크립트가 빌드 시점에
 * 양쪽을 대조해서 어긋나면 실패하도록 되어 있다.
 */
export type Region = {
  /** DB의 complexes.region 과 동일한 값 */
  region: string;
  /** SVG path의 d 속성 */
  d: string;
  labelX: number;
  labelY: number;
  count: number;
};

export const REGIONS: Region[] = regionMap.regions;
export const REGION_VIEWBOX = regionMap.viewBox;
export const REGION_SOURCE = regionMap.source;

const BY_NAME = new Map(REGIONS.map((r) => [r.region, r]));

/** 쿼리스트링으로 들어온 값을 검증한다. 모르는 값이면 undefined를 돌려 전체 검색으로 되돌린다. */
export function resolveRegion(value: string | undefined): Region | undefined {
  if (!value) return undefined;
  return BY_NAME.get(value);
}

/**
 * 지도 위·칩에 쓰는 짧은 이름.
 *
 * 규칙으로 깎으려 하면 "충청북도 → 충북"과 "경기도 → 경기"가 서로 다른 규칙이라
 * 금방 어긋난다. 16개뿐이니 그냥 적어 둔다.
 */
const SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전남광주통합특별시: "전남·광주",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

export function shortName(region: string): string {
  return SHORT[region] ?? region;
}

// 짧은 이름이 빠진 지역이 있으면 빌드가 아니라 첫 렌더에서 조용히 긴 이름이 나온다.
// 그 상태로 배포되지 않도록 모듈 로드 시점에 확인한다.
const missingShort = REGIONS.filter((r) => !SHORT[r.region]).map((r) => r.region);
if (missingShort.length) {
  throw new Error(`짧은 이름이 없는 지역: ${missingShort.join(", ")}`);
}
