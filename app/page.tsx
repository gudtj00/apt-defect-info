import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { phenomena } from "@/lib/defects";
import warrantyPeriods from "@/data/warranty-periods.json";
import Reveal from "./_components/Reveal";
import { Badge, Hero, PrimaryLink, SecondaryLink, HeroActions, SectionHeading } from "./_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "하잡 — 우리 아파트 하자보수, 아직 청구할 수 있을까?",
  description:
    "하자보수를 무상으로 청구할 수 있는 기간은 공종마다 2년·3년·5년·10년으로 다릅니다. 모르고 지나가면 같은 하자도 내 돈으로 고쳐야 합니다.",
};

/** 담보책임기간을 연수별로 묶는다 — 숫자는 전부 법령 데이터에서 계산한다. */
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
        badge={<Badge>공동주택관리법 제36조·시행령 별표4</Badge>}
        title="하자는 그대로인데,"
        accent="청구할 수 있는 기간은 끝납니다"
        description="벽에 금이 가고 물이 새도, 정해진 기간이 지나면 건설사에 무상 보수를 요구할 수 없습니다. 그 기간이 언제까지인지 모른 채 지나가는 경우가 많습니다."
      >
        <HeroActions>
          <PrimaryLink href="/calculator">우리 단지 기간 확인하기</PrimaryLink>
          <SecondaryLink href="/claim">청구 절차 보기</SecondaryLink>
        </HeroActions>
      </Hero>

      {/* 1 — 기간이 공종마다 다르다 */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <SectionHeading
              title="기간은 하나가 아닙니다"
              description="어디가 고장났느냐에 따라 2년에서 10년까지 제각각입니다"
            />
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-10 space-y-4">
              {buckets.map((b) => (
                <div key={b.years} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-slate-900">{b.years}년</span>
                    <span className="text-xs font-medium text-slate-400">{b.count}개 공종</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(b.years / maxYears) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {b.years === 2
                      ? "도배·도장·타일 같은 마감공사입니다. 가장 눈에 잘 띄는데 가장 먼저 끝납니다."
                      : b.years === 3
                        ? "난방·급수·창호·조경 등 대부분의 설비공사가 여기 속합니다."
                        : b.years === 5
                          ? "철근콘크리트, 방수, 지붕 등 구조에 가까운 공사입니다."
                          : "기둥·보·내력벽 같은 주요구조부와 지반공사입니다. 가장 길게 보장됩니다."}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 text-center text-xs leading-6 text-slate-400">
              기준: 공동주택관리법 시행령 제36조 및 별표4 · 시설공사 {warrantyPeriods.categories.length}개 공종
              분류
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2 — 실제로 이런 하자가 접수된다 */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <SectionHeading
              title="드문 일이 아닙니다"
              description="하자심사·분쟁조정위원회에 실제 접수된 사건들입니다"
            />
          </Reveal>

          {totalCases && defectRate ? (
            <Reveal delay={100}>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="text-4xl font-extrabold tracking-tight text-slate-900">{totalCases}</div>
                  <p className="mt-2 text-sm text-slate-500">건 접수 (2021년~2026년 2월 누적)</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
                  <div className="text-4xl font-extrabold tracking-tight text-emerald-700">{defectRate}%</div>
                  <p className="mt-2 text-sm text-emerald-900">실제로 하자로 인정됨</p>
                </div>
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={150}>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-900">어떤 하자가 많았나</p>
              <ul className="mt-4 space-y-3">
                {phenomena.ranking.map((p) => (
                  <li key={p.name}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-slate-700">{p.name}</span>
                      <span className="font-semibold text-slate-500">{(p.share * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${(p.share / maxShare) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-6 text-slate-400">
                출처: 국토일보 보도(2026-03) 기준 하자심사·분쟁조정위원회 통계
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3 — 기간을 놓치면 벌어지는 일 */}
      <section className="border-b border-slate-100 bg-slate-900">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <h2 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
              기간이 지나면, 하자가 인정돼도 소용이 없습니다
            </h2>
            <p className="mt-3 text-center text-sm leading-7 text-slate-300">
              분쟁조정위원회에 접수된 사건이 &ldquo;하자 아님&rdquo;으로 끝나는 이유에는 실제로 하자가 아닌 경우
              말고도 <strong className="font-semibold text-white">담보책임기간이 지나버린 경우</strong>가 포함돼
              있습니다. 기간을 넘기면 같은 하자를 내 돈으로 고쳐야 합니다.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { step: "기간 안에 청구", result: "건설사가 무상으로 보수", tone: "good" },
                { step: "기간이 지난 뒤 발견", result: "무상 청구가 어려워짐", tone: "bad" },
                { step: "청구한 사실을 못 남김", result: "기간 내 청구를 입증하기 어려움", tone: "bad" },
              ].map((row) => (
                <div
                  key={row.step}
                  className={`rounded-2xl border p-5 ${
                    row.tone === "good" ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{row.step}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      row.tone === "good" ? "text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    {row.result}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 text-center text-xs leading-6 text-slate-500">
              담보책임기간 내에 청구했다는 사실을 남겨두는 것이 중요하다는 점은 실무에서 반복적으로 지적됩니다
              (한국아파트신문 전문가 기고 등).
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — 그래서 무엇을 할 수 있나 */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <SectionHeading title="지금 확인해 보세요" description="가입 없이, 단지명만 있으면 됩니다" />
          </Reveal>

          <Reveal delay={100}>
            <ol className="mt-10 space-y-4">
              {[
                {
                  n: 1,
                  title: "우리 단지 기간 확인",
                  desc: `전국 ${count.toLocaleString()}개 단지의 공종별 잔여 기간을 계산해 드립니다.`,
                  href: "/calculator",
                  cta: "계산기 열기",
                },
                {
                  n: 2,
                  title: "내 증상이 하자인지 찾기",
                  desc: "증상을 입력하면 관련된 하자판정기준 조문을 안내합니다.",
                  href: "/defect",
                  cta: "하자 유형 검색",
                },
                {
                  n: 3,
                  title: "청구서 만들어 보내기",
                  desc: "법 조항을 인용한 청구서를 채워서 바로 쓸 수 있습니다.",
                  href: "/claim",
                  cta: "청구 절차 보기",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{s.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                  <Link
                    href={s.href}
                    className="shrink-0 self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 no-underline transition hover:border-emerald-300 hover:text-emerald-700 sm:self-auto"
                  >
                    {s.cta}
                  </Link>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 text-center">
              <PrimaryLink href="/calculator">우리 단지부터 확인하기</PrimaryLink>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
