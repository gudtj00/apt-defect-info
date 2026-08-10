// Phase 1 법적 설계에서 정한 상수. scripts/legal-lint.mjs와 향후 Next.js 컴포넌트가 공유한다.
// 근거: docs/phase1-legal-design.md — 대법원 2022도699 판결의 유죄 사유 4가지를 반대로 설계.

/**
 * 사이트 어디에서도 정당한 용례가 없는 단어. 법령·고시 원문에 등장하지 않으므로
 * 전체 스캔 대상(모든 JSX/TSX/MD)에서 무조건 차단한다.
 */
export const BANNED_WORDS_ALWAYS = [
  "최악",
  "엉터리",
  "피하세요",
  "주의하세요",
  "블랙리스트",
] as const;

/**
 * 건설사를 직접 지목·평가하는 콘텐츠(건설사 프로필/명단 페이지)에서만 차단하는 단어.
 * "불량"·"위험"·"조심"·"부실"은 하자판정기준 고시 원문에 "작동불량", "기능불량",
 * "고정불량", "결선불량", "안전상 위험" 등으로 실제 등장하는 법정 용어이므로,
 * 하자 유형 사전(Phase 3)처럼 법령을 인용하는 콘텐츠에서는 차단하면 안 된다.
 * 반드시 BUILDER_SCOPED_PATH_MARKERS에 해당하는 경로에서만 검사한다.
 */
export const BANNED_WORDS_BUILDER_SCOPED = ["부실", "불량", "위험", "조심"] as const;

/**
 * 이 문자열이 파일 경로에 포함되면 BANNED_WORDS_BUILDER_SCOPED 검사를 적용한다.
 * 건설사를 지목·서술하는 라우트/컴포넌트/콘텐츠 디렉터리 기준.
 */
export const BUILDER_SCOPED_PATH_MARKERS = [
  "/builder/",
  "\\builder\\",
  "/rank/",
  "\\rank\\",
  "content/builders",
  "content\\builders",
  "Builder", // BuilderCard.tsx, BuilderProfile.tsx 등 컴포넌트명
];

/** 모든 페이지 하단에 고정 노출할 시점 고지 문구. {date} 자리에 공표/집계 기준일을 채운다. */
export const STANDARD_DISCLAIMER =
  "본 정보는 {date} 시점 공표 자료이며 이후 변경됐을 수 있습니다.";

/** 담보책임기간 계산 결과 화면에 붙이는 면책 문구. */
export const CALC_DISCLAIMER =
  "법정 기간 계산 결과이며, 실제 청구 가능 여부는 인도일·하자 발생 시점 등에 따라 달라질 수 있습니다.";

/** 이의신청·정정요청 처리 기한(영업일). 건설사 페이지에 상시 노출해야 한다. */
export const CORRECTION_SLA_BUSINESS_DAYS = 3;

/**
 * 판정 "건수"와 "비율"은 정의가 다르므로(비율 = 하자 건수 ÷ 판정받은 단지의 공급세대수)
 * 절대 같은 컬럼/라벨로 섞어 표시하지 않는다. 비율 표시 시 반드시 이 주석을 함께 노출한다.
 */
export const RATIO_CAVEAT =
  "이 비율은 판정받은 단지의 공급세대수 대비 하자 건수이며, 소규모 단지일수록 높게 나오는 지표입니다.";
