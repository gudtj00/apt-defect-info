import Link from "next/link";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { searchComplexes } from "@/lib/apt-search";
import HomeSearchBox from "../HomeSearchBox";
import { Badge, Hero } from "../_components/ui";

export const dynamic = "force-dynamic"; // MVP: 검색은 매 요청 DB 조회. 실제 서비스 규모에선 캐싱/색인 전략 필요.

export const metadata = {
  title: "담보책임기간 계산기 — 하잡",
  description:
    "단지명으로 검색하면 공종별 하자보수 담보책임기간이 얼마나 남았는지 확인할 수 있습니다. 전국 아파트 단지 수록.",
};

const QUICK_BRANDS = ["자이", "래미안", "힐스테이트", "푸르지오", "아이파크"];

export default async function CalculatorPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = searchComplexes(q, 20);
  const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(complexes).all() as { count: number }[];

  return (
    <div>
      <Hero
        badge={<Badge>전국 {count.toLocaleString()}개 단지 수록</Badge>}
        title="우리 단지는"
        accent="얼마나 남았을까?"
        description="단지명으로 검색하면 공종별로 담보책임기간이 언제 끝나는지, 며칠 남았는지 확인할 수 있습니다."
      >
        <div className="text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <HomeSearchBox defaultValue={q} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">브랜드로 찾아보기</span>
              {QUICK_BRANDS.map((b) => (
                <Link
                  key={b}
                  href={`/calculator?q=${encodeURIComponent(b)}`}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-slate-600 no-underline hover:border-emerald-300 hover:text-emerald-700"
                >
                  {b}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Hero>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {q ? (
          results.length === 0 ? (
            <p className="text-center text-slate-400">검색 결과가 없습니다.</p>
          ) : (
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
          )
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm leading-7 text-slate-500">
            <p className="font-semibold text-slate-900">검색 결과가 여기에 표시됩니다</p>
            <p className="mt-1">
              단지명 일부만 입력해도 됩니다. 단지를 고르면 공종별 잔여 기간과 만료일을 표로 보여드립니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
