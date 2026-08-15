import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { searchComplexes } from "@/lib/apt-search";
import HomeSearchBox from "../HomeSearchBox";
import { Badge, Hero } from "../_components/ui";

export const dynamic = "force-dynamic"; // MVP: 검색은 매 요청 DB 조회. 실제 서비스 규모에선 캐싱/색인 전략 필요.

export const metadata = {
  title: "담보책임기간 계산기 | 하잡",
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
        <div className="rounded-2xl border border-line bg-surface p-5 text-left">
          <HomeSearchBox defaultValue={q} />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-3">브랜드로 찾아보기</span>
            {QUICK_BRANDS.map((b) => (
              <Link
                key={b}
                href={`/calculator?q=${encodeURIComponent(b)}`}
                className="rounded-full border border-line px-3 py-1 text-ink-2 no-underline transition hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink active:translate-y-px"
              >
                {b}
              </Link>
            ))}
          </div>
        </div>
      </Hero>

      <div className="mx-auto max-w-3xl px-5 py-12">
        {q ? (
          results.length === 0 ? (
            // 결과 없음도 화면 하나로 대접한다. 다음에 뭘 할지 알려주지 않으면 여기서 끝난다.
            <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
              <p className="font-bold text-ink">
                &lsquo;{q}&rsquo; 검색 결과가 없습니다
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-2">
                단지명 전체 대신 앞의 두세 글자만 넣어보세요. 등록된 이름과 부르는 이름이 다른 단지도 있습니다.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
                {QUICK_BRANDS.map((b) => (
                  <Link
                    key={b}
                    href={`/calculator?q=${encodeURIComponent(b)}`}
                    className="rounded-full border border-line px-3 py-1 text-ink-2 no-underline transition hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-2">
                <span className="tnum font-semibold text-ink">{results.length}</span>개 단지를 찾았습니다
              </p>
              <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-surface">
                {results.map((c) => (
                  <li key={c.kaptCode}>
                    <Link
                      href={`/apt/${c.slug}`}
                      className="flex items-center gap-4 px-5 py-4 text-inherit no-underline transition hover:bg-inset"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{c.name}</span>
                        <span className="mt-0.5 block text-sm text-ink-2">{c.address ?? c.region}</span>
                      </span>
                      <CaretRightIcon
                        size={18}
                        weight="bold"
                        aria-hidden="true"
                        className="shrink-0 text-ink-3"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : (
          <div className="rounded-2xl border border-line bg-surface px-5 py-6 leading-7 text-ink-2">
            <p className="font-semibold text-ink">검색 결과가 여기에 표시됩니다</p>
            <p className="mt-1 text-sm">
              단지명 일부만 입력해도 됩니다. 단지를 고르면 공종별 잔여 기간과 만료일을 표로 보여드립니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
