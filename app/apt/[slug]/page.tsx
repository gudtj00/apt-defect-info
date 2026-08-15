import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateWarranty, type WarrantyLineItem } from "@/lib/warranty-calc";
import { CALC_DISCLAIMER } from "@/lib/legal-constants";
import { SITE_URL } from "@/lib/site";
import { Badge } from "../../_components/ui";

// ISR: 전국 단지를 배치로 나눠 적재하는 중이라(pipeline/ingest_complexes.mjs all) 빌드 시점에
// DB에 있는 만큼만 미리 정적 생성하고, 아직 없는 슬러그는 첫 요청 때 생성 후 캐시된다
// (dynamicParams 기본값 true). revalidate로 하루 한 번 재검증. 담보책임 상태는
// "만료 임박" 임계값이 90일이라 하루 단위 신선도로 충분하다.
export const revalidate = 86400;

export async function generateStaticParams() {
  return db.select({ slug: complexes.slug }).from(complexes).all();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const complex = db.select().from(complexes).where(eq(complexes.slug, slug)).get();
  if (!complex) return {};

  const builderPart = complex.builderName ? complex.builderName : "시공사 정보 없음";
  const yearPart = complex.usedate && complex.usedate.length >= 4 ? `${complex.usedate.slice(0, 4)}년 준공` : "준공년도 정보 없음";
  const title = `${complex.name} 하자보수 청구 가능 기간 | ${builderPart}·${yearPart}`;
  const description = `${complex.name}(${complex.address ?? complex.region ?? ""}) 공종별 하자보수 담보책임기간 잔여 현황.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/apt/${slug}` },
  };
}

const STATUS_LABEL: Record<WarrantyLineItem["status"], string> = {
  active: "청구 가능",
  expiring_soon: "곧 만료",
  expired: "만료됨",
};

// 상태를 색으로만 구분하지 않고 글자로도 쓴다. 색을 구분하기 어려운 사람이 있다.
const STATUS_STYLE: Record<WarrantyLineItem["status"], string> = {
  active: "bg-accent-soft text-accent-soft-ink ring-accent-line",
  expiring_soon: "bg-warn text-warn-ink ring-warn-line",
  expired: "bg-inset text-ink-3 ring-line",
};

function ItemRow({ item }: { item: WarrantyLineItem }) {
  // 만료된 줄을 opacity로 흐리면 글자 대비까지 같이 깎여서 읽기 어려워진다.
  // 구분은 배경과 상태 배지가 맡는다.
  return (
    <tr className={`border-t border-line-soft ${item.status === "expired" ? "bg-inset" : ""}`}>
      <td className="px-4 py-3 font-medium text-ink">{item.categoryName}</td>
      <td className="tnum px-4 py-3 text-center text-ink-2">{item.years}년</td>
      <td className="tnum whitespace-nowrap px-4 py-3 text-ink-2">{item.expiryDate}</td>
      <td className="px-4 py-3">
        <span
          className={`tnum inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_STYLE[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
          {item.status !== "expired" && ` · ${item.remainingDays}일 남음`}
        </span>
      </td>
    </tr>
  );
}

function WarrantyTable({
  items,
  expiryLabel,
}: {
  items: WarrantyLineItem[];
  expiryLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-inset text-left text-xs font-semibold text-ink-2">
            <th className="px-4 py-3">공종</th>
            <th className="px-4 py-3 text-center">기간</th>
            <th className="px-4 py-3">{expiryLabel}</th>
            <th className="px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <ItemRow key={`${i.categoryCode}-${i.part}`} item={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ComplexPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ handoverDate?: string }>;
}) {
  const { slug } = await params;
  const { handoverDate } = await searchParams;
  const complex = db.select().from(complexes).where(eq(complexes.slug, slug)).get();
  if (!complex) notFound();

  const result = calculateWarranty(complex.usedate, undefined, handoverDate);
  const anyClaimable = result.ok && result.items.some((i) => i.status !== "expired");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: complex.name,
    url: `${SITE_URL}/apt/${slug}`,
    ...(complex.address || complex.region
      ? { address: { "@type": "PostalAddress", streetAddress: complex.address ?? undefined, addressRegion: complex.region ?? undefined } }
      : {}),
    ...(complex.householdCount ? { numberOfAccommodationUnits: { "@type": "QuantitativeValue", value: complex.householdCount } } : {}),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-10 text-center sm:py-14">
          {result.ok ? (
            <div className="mb-5">
              <Badge>사용승인일 {result.usedate}</Badge>
            </div>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-4xl">{complex.name}</h1>
          <p className="mt-3 text-ink-2">{complex.address ?? complex.region}</p>
          <p className="mt-1 text-sm text-ink-3">
            시공사 {complex.builderName ?? "정보 없음"}
            {complex.householdCount ? ` · ${complex.householdCount.toLocaleString()}세대` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {!result.ok ? (
          <div className="rounded-2xl border border-warn-line bg-warn px-5 py-4 text-sm leading-7 text-warn-ink">
            <strong className="font-bold">사용승인일 정보 없음.</strong> 이 단지는 계산에 필요한 사용승인일 정보가
            없어({result.reason}) 담보책임기간을 계산할 수 없습니다.
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-bold text-ink">공용부분</h2>
              <p className="mt-1 text-sm leading-7 text-ink-2">
                복도·주차장·외벽 등 함께 쓰는 부분입니다. 사용승인일 기준으로 확정된 계산 결과입니다.
              </p>
              <div className="mt-4">
                <WarrantyTable items={result.items.filter((i) => i.part === "공용")} expiryLabel="만료일" />
              </div>
            </section>

            <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-base font-bold text-ink">전유부분 실제 인도일을 아시나요?</h2>
              <p className="mt-1.5 text-sm leading-7 text-ink-2">
                전유부분(내 집 안)의 담보책임기간은 원래 실제 입주 시 받은 인도일부터 계산합니다. 입주 계약서나
                인도증서에 적힌 실제 인도일을 알고 있다면 입력하세요. 아래 전유부분 결과가 추정치 대신 확정값으로
                바뀝니다.
              </p>

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-accent">
                  이 날짜가 정확히 뭔가요? 어떻게 확인하나요?
                </summary>
                <div className="mt-3 space-y-3 text-sm leading-7 text-ink-2">
                  <p>
                    <strong className="font-semibold text-ink">이 날짜가 뜻하는 것:</strong>{" "}
                    사업주체(시행사·시공사)가 이 세대(전유부분)를 <strong className="font-semibold">최초 입주자</strong>
                    에게 처음 넘겨준 날입니다(공동주택관리법 제36조③1호). 지금 몇 번째 소유자인지와 무관하게 그 세대에
                    고정된 날짜라서, 매매로 소유자가 바뀌어도 이 날짜는 바뀌지 않습니다. 같은 단지라도 동·호수마다
                    인도일이 다를 수 있습니다.
                  </p>
                  <p className="font-semibold text-ink">확인 방법 (확실한 순서대로)</p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>
                      <strong className="font-semibold text-ink">등기부등본의 &#39;소유권보존등기일&#39;:</strong>{" "}
                      인터넷등기소에서 누구나 발급 가능합니다. 실제 인도일과 정확히 같지는 않을 수 있지만 통상 비슷한
                      시기라 가장 접근하기 쉬운 근사치입니다.
                    </li>
                    <li>
                      <strong className="font-semibold text-ink">관리사무소 문의:</strong> 관리주체는
                      사업주체로부터 세대별 인도일을 넘겨받아 등록할 법적 의무가 있습니다(공동주택관리정보시스템 운영
                      관리규정 제15조④). 다만 실제 열람 절차나 제공 여부는 단지마다 다를 수 있습니다.
                    </li>
                    <li>
                      <strong className="font-semibold text-ink">주택인도증서 원본:</strong> 최초 입주자가 입주
                      시 사업주체로부터 받은 서류입니다. 본인이 최초 입주자가 아니라면 구하기 어려울 수 있습니다.
                    </li>
                  </ol>
                  <p className="text-xs leading-6 text-ink-3">
                    확실하지 않다면 입력하지 않아도 됩니다. 사용승인일 기준 추정치로 계속 안내해드립니다.
                  </p>
                </div>
              </details>

              <form method="get" className="mt-4">
                <label htmlFor="handover-date" className="mb-1.5 block text-sm font-semibold text-ink">
                  실제 인도일
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="handover-date"
                    type="date"
                    name="handoverDate"
                    defaultValue={handoverDate ?? ""}
                    aria-invalid={result.jeonyuHandoverDateError ? true : undefined}
                    aria-describedby={result.jeonyuHandoverDateError ? "handover-date-error" : undefined}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:translate-y-px"
                  >
                    적용
                  </button>
                  {handoverDate && (
                    <Link
                      href={`/apt/${slug}`}
                      className="text-sm text-ink-2 no-underline hover:text-ink hover:underline"
                    >
                      초기화
                    </Link>
                  )}
                </div>
              </form>

              {result.jeonyuHandoverDateError && (
                <p id="handover-date-error" role="alert" className="mt-2 text-sm text-danger">
                  {result.jeonyuHandoverDateError}
                </p>
              )}
              <p className="mt-2 text-xs leading-6 text-ink-3">
                입력한 날짜는 검증되지 않은 자기신고 값이며, 저장되지 않고 이 조회에만 사용됩니다.
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink">
                전유부분{" "}
                <span className="text-sm font-semibold text-ink-3">
                  {result.jeonyuHandoverDate ? "실제 인도일 기준 확정값" : "추정치"}
                </span>
              </h2>
              <p className="mt-1 text-sm leading-7 text-ink-2">
                {result.jeonyuHandoverDate
                  ? `입력하신 실제 인도일(${result.jeonyuHandoverDate}) 기준으로 계산한 결과입니다.`
                  : "실제 입주자 인도일이 아니라 사용승인일 기준으로 추정한 값입니다. 실제 인도일이 다르면 결과가 달라질 수 있습니다."}
              </p>
              <div className="mt-4">
                <WarrantyTable
                  items={result.items.filter((i) => i.part === "전유")}
                  expiryLabel={result.jeonyuHandoverDate ? "만료일" : "만료일(추정)"}
                />
              </div>
            </section>

            {result.items.some((i) => i.caveat) && (
              <div className="mt-6 rounded-2xl border border-warn-line bg-warn px-5 py-4 text-sm leading-7 text-warn-ink">
                {result.items.find((i) => i.caveat)?.caveat}
              </div>
            )}
          </>
        )}

        {/* 결과만 보여주고 끝내면 "그래서 뭘 해야 하나"에서 이탈한다. 다음 행동으로 잇는다. */}
        <div
          className={`mt-10 rounded-2xl border px-5 py-5 ${
            anyClaimable ? "border-accent-line bg-accent-soft" : "border-line bg-surface"
          }`}
        >
          <strong
            className={`block text-base font-bold ${anyClaimable ? "text-accent-soft-ink" : "text-ink"}`}
          >
            {anyClaimable ? "아직 청구할 수 있는 공종이 있습니다" : "그래서 이제 무엇을 할 수 있나요?"}
          </strong>
          <p className={`mt-2 text-sm leading-7 ${anyClaimable ? "text-accent-soft-ink" : "text-ink-2"}`}>
            {anyClaimable
              ? "누구에게 어떻게 청구하는지, 시공사가 15일 안에 어떤 답을 해야 하는지, 응하지 않으면 무엇을 할 수 있는지 절차를 정리해 두었습니다."
              : "담보책임기간이 지나도 선택지가 남아 있는 경우가 있습니다. 청구 절차와 분쟁조정 경로를 확인해 보세요."}
          </p>
          <Link
            href="/claim"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent no-underline transition hover:bg-accent-hover active:translate-y-px"
          >
            하자보수 청구 절차 보기
          </Link>
        </div>

        <p className="mt-6 text-xs leading-6 text-ink-3">{CALC_DISCLAIMER}</p>
      </div>
    </div>
  );
}
