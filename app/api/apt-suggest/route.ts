import { NextRequest, NextResponse } from "next/server";
import { searchComplexes } from "@/lib/apt-search";
import { resolveRegion } from "@/lib/regions";

// 홈 검색창 자동완성용. 단지명·주소만 반환한다 — 계산 결과 등 민감할 것 없는 공개 정보라 인증 없이 연다.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);

  // 지도에서 지역을 골랐다면 자동완성도 그 안에서만 제안한다.
  // 모르는 값이면 무시하고 전국으로 되돌린다(임의 문자열이 SQL로 새어들지 않도록 화이트리스트 검증).
  const region = resolveRegion(req.nextUrl.searchParams.get("region") ?? undefined);

  const rows = searchComplexes(q, 6, region?.region);
  return NextResponse.json(
    rows.map((c) => ({ slug: c.slug, name: c.name, address: c.address ?? c.region })),
  );
}
