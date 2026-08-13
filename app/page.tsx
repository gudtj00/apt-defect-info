import Link from "next/link";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { phenomena } from "@/lib/defects";
import { searchComplexes } from "@/lib/apt-search";
import HomeSearchBox from "./HomeSearchBox";
import { Badge, Card, CardGrid, Hero, SectionHeading } from "./_components/ui";

export const dynamic = "force-dynamic"; // MVP: 검색은 매 요청 DB 조회. 실제 서비스 규모에선 캐싱/색인 전략 필요.

const QUICK_BRANDS = ["자이", "래미안", "힐스테이트", "푸르지오", "아이파크"];

const ICONS = {
  calculator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="12" x2="8" y2="12.01" />
      <line x1="12" y1="12" x2="12" y2="12.01" />
      <line x1="16" y1="12" x2="16" y2="12.01" />
      <line x1="8" y1="16" x2="8" y2="16.01" />
      <line x1="12" y1="16" x2="12" y2="16.01" />
      <line x1="16" y1="16" x2="16" y2="16.01" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = searchComplexes(q, 20);
  const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(complexes).all() as { count: number }[];
  const totalCases = phenomena.note.match(/([\d,]+)건 접수/)?.[1] ?? "";
  const defectRate = phenomena.note.match(/([\d.]+)% 하자 판정/)?.[1] ?? "";

  return (
    <div>
      <Hero
        badge={<Badge>전국 {count.toLocaleString()}개 단지 수록</Badge>}
        title="우리 아파트, 아직"
        accent="하자보수 받을 수 있을까?"
        description="단지명으로 검색하면 공종별 담보책임기간이 얼마나 남았는지 바로 확인할 수 있습니다."
        keywords={["법령 근거", "가입 없이", "무료"]}
      >
        <div id="search" className="scroll-mt-24 text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <HomeSearchBox defaultValue={q} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">브랜드로 찾아보기</span>
              {QUICK_BRANDS.map((b) => (
                <Link
                  key={b}
                  href={`/?q=${encodeURIComponent(b)}`}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-slate-600 no-underline hover:border-emerald-300 hover:text-emerald-700"
                >
                  {b}
                </Link>
              ))}
            </div>
          </div>

          {totalCases && defectRate ? (
            <p className="mt-4 text-center text-xs leading-6 text-slate-400">
              지난 5년간 접수된 하자 {totalCases}건 중 {defectRate}%가 실제 하자로 인정됐습니다. 다만 기간을
              놓치면 인정되더라도 무상 보수는 받을 수 없습니다.
            </p>
          ) : null}
        </div>
      </Hero>

      {/* 검색 결과 — 서비스 카드보다 먼저, 검색창 바로 아래 노출한다 */}
      {q && (
        <div className="mx-auto max-w-3xl px-5 pt-10">
          {results.length === 0 && <p className="text-center text-slate-400">검색 결과가 없습니다.</p>}
          <ul className="flex flex-col gap-3">
            {results.map((c) => (
              <li key={c.kaptCode}>
                <Link
                  href={`/apt/${c.slug}`}
                  className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-inherit no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="mt-0.5 text-sm text-slate-500">{c.address ?? c.region}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mx-auto max-w-5xl px-5 py-14">
        <SectionHeading title="주요 서비스" description="하자 확인부터 청구까지, 필요한 단계로 바로 이동하세요" />
        <div className="mt-8">
          <CardGrid>
            <Card
              href="#search"
              icon={ICONS.calculator}
              title="담보책임기간 계산기"
              description="우리 단지의 공종별 잔여 기간을 확인합니다"
              footer="계산"
              badge="인기"
            />
            <Card
              href="/defect"
              icon={ICONS.search}
              title="하자 유형 검색"
              description="증상을 입력하면 해당하는 판정 조문을 찾아줍니다"
              footer="검색"
              badge="인기"
            />
            <Card
              href="/claim"
              icon={ICONS.doc}
              title="하자보수 청구 절차"
              description="청구 방법과 바로 쓸 수 있는 청구서 양식"
              footer="절차"
            />
            <Card
              href="/defect/articles"
              icon={ICONS.list}
              title="전체 조문 목록"
              description="하자판정기준 38개 조문을 한눈에"
              footer="자료"
            />
          </CardGrid>
        </div>
      </section>
    </div>
  );
}
