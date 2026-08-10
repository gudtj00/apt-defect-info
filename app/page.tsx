import Link from "next/link";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { phenomena } from "@/lib/defects";
import { searchComplexes } from "@/lib/apt-search";
import HomeSearchBox from "./HomeSearchBox";

export const dynamic = "force-dynamic"; // MVP: 검색은 매 요청 DB 조회. 실제 서비스 규모에선 캐싱/색인 전략 필요.

const QUICK_BRANDS = ["자이", "래미안", "힐스테이트", "푸르지오", "아이파크"];

const FEATURE_TILES: { href: string; label: string; desc: string; bg: string; icon: React.ReactNode }[] = [
  {
    href: "#search",
    label: "담보책임기간 계산기",
    desc: "우리 단지 잔여 기간",
    bg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    icon: (
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
  },
  {
    href: "/defect",
    label: "하자 유형 검색",
    desc: "증상으로 조문 찾기",
    bg: "bg-gradient-to-br from-sky-400 to-blue-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/defect/articles",
    label: "전체 조문 목록",
    desc: "38개 판정 조문",
    bg: "bg-gradient-to-br from-amber-400 to-orange-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: "/faq",
    label: "자주 묻는 질문",
    desc: "10가지 핵심 Q&A",
    bg: "bg-gradient-to-br from-violet-400 to-purple-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = searchComplexes(q, 20);
  const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(complexes).all() as { count: number }[];
  const totalCases = phenomena.note.match(/([\d,]+)건 접수/)?.[1] ?? "";
  const defectRate = phenomena.note.match(/([\d.]+)% 하자 판정/)?.[1] ?? "";

  return (
    <div>
      <section className="bg-gradient-to-b from-emerald-50 via-teal-50 to-slate-50">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            담보책임기간이 지나면 무상 보수를 받을 수 없습니다
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            우리 아파트, 아직
            <br />
            하자보수 무상 청구 가능할까요?
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-slate-600">
            단지명 또는 주소로 검색하면 공종별 담보책임기간 잔여 현황을 바로 확인할 수 있습니다.
            {totalCases && defectRate && (
              <> 지난 5년간 접수된 하자 {totalCases}건 중 {defectRate}%가 실제로 하자로 인정됐지만, 기간을 놓치면 인정돼도 무상 수리는 받을 수 없습니다.</>
            )}
          </p>
          <p className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
            현재 {count.toLocaleString()}개 단지 수록
          </p>

          <div id="search" className="mx-auto mt-8 max-w-3xl scroll-mt-24 text-left">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <Link
              href="/defect"
              className="mt-4 flex flex-col items-start gap-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-left text-white no-underline shadow-sm transition hover:from-emerald-700 hover:to-teal-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-semibold">내 집 벽지·타일·누수, 하자일까요?</span>
              <span className="text-sm font-semibold text-white/90">하자 유형 검색에서 확인 →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 검색 결과 — 기능 아이콘 그리드보다 먼저, 검색창 바로 아래 노출한다 */}
      {q && (
        <div className="mx-auto max-w-3xl px-5 py-8">
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

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-5 py-8 sm:grid-cols-4">
          {FEATURE_TILES.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center no-underline transition hover:bg-slate-50"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${tile.bg}`}>
                <span className="h-6 w-6">{tile.icon}</span>
              </span>
              <span className="text-sm font-semibold text-slate-900">{tile.label}</span>
              <span className="text-xs text-slate-400">{tile.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
