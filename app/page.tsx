import Link from "next/link";
import { redirect } from "next/navigation";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { phenomena } from "@/lib/defects";
import warrantyPeriods from "@/data/warranty-periods.json";
import Reveal from "./_components/Reveal";
import {
  Badge,
  Hero,
  PrimaryLink,
  SecondaryLink,
  HeroActions,
  SectionHeading,
  FootNote,
} from "./_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "하잡 | 우리 아파트 하자보수, 아직 청구할 수 있을까?",
  description:
    "하자보수를 무상으로 청구할 수 있는 기간은 공종마다 2년·3년·5년·10년으로 다릅니다. 모르고 지나가면 같은 하자도 내 돈으로 고쳐야 합니다.",
};

/** 담보책임기간을 연수별로 묶는다. 숫자는 전부 법령 데이터에서 계산한다. */
function periodBuckets() {
  const counts = new Map<number, number>();
  warrantyPeriods.categories.forEach((c) => counts.set(c.years, (counts.get(c.years) ?? 0) + 1));
  const structuralYears = warrantyPeriods.structuralCategories.map((s) => s.years);
  const maxStructural = Math.max(...structuralYears);
  counts.set(maxStructural, (counts.get(maxStructural) ?? 0) + warrantyPeriods.structuralCategories.length);

  return [...counts.entries()]
    .map(([years, count]) => ({ years, count }))
    .sort((a, b) => a.years - b.years);
}

const BUCKET_NOTE: Record<number, string> = {
  2: "도배·도장·타일 같은 마감공사입니다. 가장 눈에 잘 띄는데 가장 먼저 끝납니다.",
  3: "난방·급수·창호·조경 등 대부분의 설비공사가 여기 속합니다.",
  5: "철근콘크리트, 방수, 지붕 등 구조에 가까운 공사입니다.",
  10: "기둥·보·내력벽 같은 주요구조부와 지반공사입니다. 가장 길게 보장됩니다.",
};

/** 홈 마지막 섹션의 진입점. 각 탭으로 한 번에 넘어가게 한다. */
const ENTRY_POINTS = [
  {
    n: 1,
    title: "우리 단지 기간 확인",
    href: "/calculator",
    desc: (count: string) => `전국 ${count}개 단지의 공종별 잔여 기간을 계산해 드립니다.`,
  },
  {
    n: 2,
    title: "내 증상이 하자인지 찾기",
    href: "/defect",
    desc: () => "증상을 입력하면 관련된 하자판정기준 조문을 안내합니다.",
  },
  {
    n: 3,
    title: "청구서 만들어 보내기",
    href: "/claim",
    desc: () => "법 조항을 인용한 청구서를 채워서 바로 쓸 수 있습니다.",
  },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // 검색은 /calculator로 옮겼다. 기존에 공유된 `/?q=...` 링크가 죽지 않도록 넘겨준다.
  const { q } = await searchParams;
  if (q) redirect(`/calculator?q=${encodeURIComponent(q)}`);

  const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(complexes).all() as { count: number }[];
  const buckets = periodBuckets();
  const maxYears = Math.max(...buckets.map((b) => b.years));
  const totalCases = phenomena.note.match(/([\d,]+)건 접수/)?.[1] ?? "";
  const defectRate = phenomena.note.match(/([\d.]+)% 하자 판정/)?.[1] ?? "";
  const maxShare = Math.max(...phenomena.ranking.map((p) => p.share));

  return (
    <div>
      <Hero
        badge={<Badge>공동주택관리법 제36조 · 시행령 별표4</Badge>}
        title="하자는 그대로인데,"
        accent="청구할 수 있는 기간은 끝납니다"
        description="벽에 금이 가고 물이 새도, 정해진 기간이 지나면 건설사에 무상 보수를 요구할 수 없습니다. 그 기간이 언제까지인지 모른 채 지나가는 경우가 많습니다."
      >
        <HeroActions>
          <PrimaryLink href="/calculator">우리 단지 기간 확인하기</PrimaryLink>
          <SecondaryLink href="/claim">청구 절차 보기</SecondaryLink>
        </HeroActions>
      </Hero>

      {/* 1. 기간이 공종마다 다르다.
          네 개를 각각 카드에 담으면 "2년과 10년의 차이"가 안 보인다.
          축 하나를 공유하는 한 장의 그래프로 둔다. */}
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <SectionHeading
              title="기간은 하나가 아닙니다"
              description="어디가 고장났느냐에 따라 2년에서 10년까지 제각각입니다"
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10 divide-y divide-line-soft rounded-2xl border border-line bg-surface">
              {buckets.map((b) => (
                <div key={b.years} className="p-5 sm:p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="tnum text-lg font-bold text-ink">{b.years}년</span>
                    <span className="tnum text-xs text-ink-3">{b.count}개 공종</span>
                  </div>
                  <div
                    className="mt-3 h-2.5 overflow-hidden rounded-full bg-inset"
                    role="img"
                    aria-label={`담보책임기간 ${b.years}년, 최장 ${maxYears}년 대비`}
                  >
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(b.years / maxYears) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-2">{BUCKET_NOTE[b.years]}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-6 text-center">
              <FootNote>
                기준: 공동주택관리법 시행령 제36조 및 별표4 · 시설공사{" "}
                {warrantyPeriods.categories.length}개 공종 분류
              </FootNote>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. 실제로 이런 하자가 접수된다 */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <SectionHeading
              title="드문 일이 아닙니다"
              description="하자심사·분쟁조정위원회에 실제 접수된 사건들입니다"
            />
          </Reveal>

          {totalCases && defectRate ? (
            <Reveal delay={80}>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-canvas p-6 text-center">
                  <div className="tnum text-4xl font-bold tracking-tight text-ink">{totalCases}</div>
                  <p className="mt-2 text-sm text-ink-2">건 접수 (2021년~2026년 2월 누적)</p>
                </div>
                <div className="rounded-2xl border border-accent-line bg-accent-soft p-6 text-center">
                  <div className="tnum text-4xl font-bold tracking-tight text-accent-soft-ink">
                    {defectRate}%
                  </div>
                  <p className="mt-2 text-sm text-accent-soft-ink">실제로 하자로 인정됨</p>
                </div>
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={140}>
            <div className="mt-4 rounded-2xl border border-line bg-canvas p-6">
              <p className="font-bold text-ink">어떤 하자가 많았나</p>
              <ul className="mt-4 space-y-3">
                {phenomena.ranking.map((p) => (
                  <li key={p.name}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="font-medium text-ink">{p.name}</span>
                      <span className="tnum font-semibold text-ink-2">{(p.share * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-inset">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(p.share / maxShare) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <FootNote>출처: 국토일보 보도(2026-03) 기준 하자심사·분쟁조정위원회 통계</FootNote>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. 기간을 놓치면 벌어지는 일.
          페이지에서 유일하게 어둡게 가는 구간이다. 여기서 한 번 멈추게 하려는 것. */}
      <section className="border-b border-line bg-deep">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <h2 className="text-center text-xl font-bold tracking-tight text-deep-ink sm:text-2xl">
              기간이 지나면, 하자가 인정돼도 소용이 없습니다
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center leading-8 text-deep-ink-2">
              분쟁조정위원회에 접수된 사건이 &ldquo;하자 아님&rdquo;으로 끝나는 이유에는, 실제로 하자가 아닌
              경우 말고도{" "}
              <strong className="font-semibold text-deep-ink">담보책임기간이 지나버린 경우</strong>가 포함돼
              있습니다. 기간을 넘기면 같은 하자를 내 돈으로 고쳐야 합니다.
            </p>
          </Reveal>

          <Reveal delay={100}>
            {/* 세 상황을 같은 크기 카드 셋으로 늘어놓으면 대비가 죽는다.
                "언제 청구했는가 → 어떻게 되는가" 한 줄씩으로 읽히게 둔다. */}
            <dl className="mx-auto mt-10 max-w-xl divide-y divide-deep-line border-y border-deep-line">
              {[
                { when: "기간 안에 청구했다", then: "건설사가 무상으로 보수", good: true },
                { when: "기간이 지난 뒤 발견했다", then: "무상 청구가 어려워짐", good: false },
                { when: "청구한 사실을 남기지 못했다", then: "기간 내 청구를 입증하기 어려움", good: false },
              ].map((row) => (
                <div
                  key={row.when}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <dt className="font-semibold text-deep-ink">{row.when}</dt>
                  <dd
                    className={`text-sm sm:text-right ${row.good ? "font-semibold text-deep-accent" : "text-deep-ink-2"}`}
                  >
                    {row.then}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-6 text-deep-ink-2">
              담보책임기간 내에 청구했다는 사실을 남겨두는 것이 중요하다는 점은 실무에서 반복적으로 지적됩니다
              (한국아파트신문 전문가 기고 등).
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4. 그래서 무엇을 할 수 있나 */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <SectionHeading title="지금 확인해 보세요" description="가입 없이, 단지명만 있으면 됩니다" />
          </Reveal>

          <Reveal delay={80}>
            <ol className="mt-10 space-y-3">
              {ENTRY_POINTS.map((s) => (
                <li key={s.n}>
                  {/* 줄 전체를 누를 수 있게 한다. 버튼만 누를 수 있으면 표적이 너무 작다. */}
                  <Link
                    href={s.href}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-canvas p-5 text-inherit no-underline transition hover:border-accent-line active:translate-y-px"
                  >
                    <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                      {s.n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink">{s.title}</span>
                      <span className="mt-0.5 block text-sm leading-7 text-ink-2">
                        {s.desc(count.toLocaleString())}
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
            </ol>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-10 text-center">
              <PrimaryLink href="/calculator">우리 단지 기간 확인하기</PrimaryLink>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
