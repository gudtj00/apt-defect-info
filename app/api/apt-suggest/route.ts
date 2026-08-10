import { NextRequest, NextResponse } from "next/server";
import { searchComplexes } from "@/lib/apt-search";

// 홈 검색창 자동완성용. 단지명·주소만 반환한다 — 계산 결과 등 민감할 것 없는 공개 정보라 인증 없이 연다.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);

  const rows = searchComplexes(q, 6);
  return NextResponse.json(
    rows.map((c) => ({ slug: c.slug, name: c.name, address: c.address ?? c.region })),
  );
}
