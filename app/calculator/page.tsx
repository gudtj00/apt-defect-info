import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { searchComplexes } from "@/lib/apt-search";
import { resolveRegion, REGION_SOURCE } from "@/lib/regions";
import HomeSearchBox from "../HomeSearchBox";
import RegionMap from "../_components/RegionMap";
import { Badge, Hero, FootNote } from "../_components/ui";

export const dynamic = "force-dynamic"; // MVP: 검색은 매 요청 DB 조회. 실제 서비스 규모에선 캐싱/색인 전략 필요.

export const metadata = {
  title: "담보책임기간 계산기 | 하잡",
  description:
    "지역을 고르고 단지명으로 검색하면 공종별 하자보수 담보책임기간이 얼마나 남았는지 확인할 수 있습니다. 전국 아파트 단지 수록.",
};

const QUICK_BRANDS = ["자이", "래미안", "힐스테이트", "푸르지오", "아이파크"];

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string }>;
}) {
  const { q = "", region: regionParam } = await searchParams;
  // 모르는 지역값이 들어오면 무시하고 전체 검색으로 되돌린다.
  const region = resolveRegion(regionParam);
  const results = searchComplexes(q, 20, region?.region);
  const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(complexes).all() as {
    count: number;
  }[];

  const brandHref = (b: string) =>
    `/calculator?${new URLSearchParams({
      ...(region ? { region: region.region } : {}),
      q: b,
    })}`;

  return (
    <div>
      <Hero
        badge={<Badge>전국 {count.toLocaleString()}개 단지 수록</Badge>}
        title="우리 단지는"
        accent="얼마나 남았을까?"
        description="지역을 고른 뒤 단지명으로 검색하면 공종별로 담보책임기간이 언제 끝나는지, 며칠 남았는지 확인할 수 있습니다."
      />

      <div className="mx-auto max-w-6xl px-5 py-12">
        {/* 왼쪽에서 지역을 좁히고 오른쪽에서 찾는다.
            지역은 선택하지 않아도 되고, 단지명을 아는 사람은 바로 오른쪽에서 끝낼 수 있다. */}
        {/* 그리드 자식은 기본 min-width가 auto라, 안쪽 글이 줄지 않으면 트랙이 컨테이너보다
            넓어져 페이지가 가로로 밀린다(375px에서 문서폭이 387px까지 벌어졌다). min-w-0으로 막는다. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14">
          <section className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-ink">지역으로 좁히기</h2>
            <p className="mt-1.5 text-sm leading-7 text-ink-2">
              고르지 않아도 됩니다. 단지명을 알고 있다면 바로 검색하세요.
            </p>
            <div className="mt-6">
              <RegionMap selected={region?.region} query={q || undefined} />
            </div>
          </section>

          <section className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {region ? `${region.region}에서 찾기` : "단지명으로 찾기"}
            </h2>
            <p className="mt-1.5 text-sm leading-7 text-ink-2">
              {region
                ? `이 지역 ${region.count.toLocaleString()}개 단지 안에서만 검색합니다.`
                : "전국에서 검색합니다. 왼쪽에서 지역을 고르면 범위가 좁아집니다."}
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
              <HomeSearchBox defaultValue={q} region={region?.region} />
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-ink-3">브랜드로 찾아보기</span>
                {QUICK_BRANDS.map((b) => (
                  <Link
                    key={b}
                    href={brandHref(b)}
                    className="rounded-full border border-line px-3 py-1 text-ink-2 no-underline transition hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink active:translate-y-px"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {q ? (
                results.length === 0 ? (
                  // 결과 없음도 화면 하나로 대접한다. 다음에 뭘 할지 알려주지 않으면 여기서 끝난다.
                  <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
                    <p className="font-bold text-ink">
                      {region ? `${region.region}에는 ` : ""}&lsquo;{q}&rsquo; 검색 결과가 없습니다
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-2">
                      단지명 전체 대신 앞의 두세 글자만 넣어보세요. 등록된 이름과 부르는 이름이 다른 단지도
                      있습니다.
                    </p>
                    {region ? (
                      <div className="mt-5">
                        <Link
                          href={`/calculator?q=${encodeURIComponent(q)}`}
                          className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent no-underline transition hover:bg-accent-hover active:translate-y-px"
                        >
                          전국에서 다시 찾기
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-ink-2">
                      <span className="tnum font-semibold text-ink">{results.length}</span>개 단지를
                      찾았습니다
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
                              <span className="mt-0.5 block text-sm text-ink-2">
                                {c.address ?? c.region}
                              </span>
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
          </section>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <FootNote>
            지도 경계: {REGION_SOURCE}. 광주광역시는 「전남광주통합특별시 설치를 위한 특별법」(2026년 7월 1일
            시행)에 따라 전남광주통합특별시로 표시합니다. 지역 구분은 단지 검색 범위를 좁히기 위한 것이며 영토·경계를
            나타내지 않습니다.
          </FootNote>
        </div>
      </div>
    </div>
  );
}
