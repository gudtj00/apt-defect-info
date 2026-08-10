import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { complexes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateWarranty, type WarrantyLineItem } from "@/lib/warranty-calc";
import { CALC_DISCLAIMER } from "@/lib/legal-constants";
import { SITE_URL } from "@/lib/site";

// ISR: 전국 단지를 배치로 나눠 적재하는 중이라(pipeline/ingest_complexes.mjs all) 빌드 시점에
// DB에 있는 만큼만 미리 정적 생성하고, 아직 없는 슬러그는 첫 요청 때 생성 후 캐시된다
// (dynamicParams 기본값 true). revalidate로 하루 한 번 재검증 — 담보책임 상태는
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
  const title = `${complex.name} 하자보수 청구 가능 기간 — ${builderPart}·${yearPart}`;
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

const STATUS_COLOR: Record<WarrantyLineItem["status"], string> = {
  active: "#059669",
  expiring_soon: "#b35900",
  expired: "#888",
};

function ItemRow({ item }: { item: WarrantyLineItem }) {
  return (
    <tr style={{ opacity: item.status === "expired" ? 0.55 : 1 }}>
      <td style={{ padding: "0.5rem 0.6rem" }}>{item.categoryName}</td>
      <td style={{ padding: "0.5rem 0.6rem", textAlign: "center" }}>{item.years}년</td>
      <td style={{ padding: "0.5rem 0.6rem" }}>{item.expiryDate}</td>
      <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600, color: STATUS_COLOR[item.status] }}>
        {STATUS_LABEL[item.status]}
        {item.status !== "expired" && ` (${item.remainingDays}일 남음)`}
      </td>
    </tr>
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
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{complex.name}</h1>
      <p style={{ color: "#555", marginBottom: "0.3rem" }}>{complex.address ?? complex.region}</p>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        시공사: {complex.builderName ?? "시공사 정보 없음"}
        {complex.householdCount ? ` · ${complex.householdCount.toLocaleString()}세대` : ""}
      </p>

      {!result.ok ? (
        <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: 8 }}>
          <strong>사용승인일 정보 없음</strong> — 이 단지는 계산에 필요한 사용승인일 정보가 없어({result.reason}) 담보책임기간을 계산할 수 없습니다.
        </div>
      ) : (
        <>
          <p style={{ marginBottom: "1rem" }}>
            사용승인일: <strong>{result.usedate}</strong>
          </p>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.3rem" }}>공용부분 (확정값)</h2>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>사용승인일 기준으로 확정된 계산 결과입니다.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.6rem" }}>공종</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>기간</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>만료일</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {result.items
                  .filter((i) => i.part === "공용")
                  .map((i) => (
                    <ItemRow key={`${i.categoryCode}-공용`} item={i} />
                  ))}
              </tbody>
            </table>
          </section>

          <section
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              전유부분 실제 인도일을 아시나요?
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.6rem" }}>
              전유부분(내 집 안)의 담보책임기간은 원래 실제 입주 시 받은 인도일부터 계산합니다. 입주 계약서나 인도증서에
              적힌 실제 인도일을 알고 있다면 입력하세요 — 아래 전유부분 결과가 추정치 대신 확정값으로 바뀝니다.
            </p>
            <details style={{ marginBottom: "0.8rem", fontSize: "0.8rem" }}>
              <summary style={{ cursor: "pointer", color: "#047857", fontWeight: 600 }}>
                이 날짜가 정확히 뭔가요? 어떻게 확인하나요?
              </summary>
              <div style={{ marginTop: "0.6rem", paddingLeft: "0.2rem", color: "#444", lineHeight: 1.7 }}>
                <p style={{ marginBottom: "0.6rem" }}>
                  <strong>이 날짜가 뜻하는 것</strong> — 사업주체(시행사·시공사)가 이 세대(전유부분)를 <strong>최초
                  입주자</strong>에게 처음 넘겨준 날입니다(공동주택관리법 제36조③1호). 지금 몇 번째 소유자인지와
                  무관하게 그 세대에 고정된 날짜라서, 매매로 소유자가 바뀌어도 이 날짜는 바뀌지 않습니다. 같은
                  단지라도 동·호수마다 인도일이 다를 수 있습니다.
                </p>
                <p style={{ marginBottom: "0.4rem" }}>
                  <strong>확인 방법</strong> (확실한 순서대로):
                </p>
                <ol style={{ margin: "0 0 0.6rem", paddingLeft: "1.2rem" }}>
                  <li style={{ marginBottom: "0.4rem" }}>
                    <strong>등기부등본의 &#39;소유권보존등기일&#39;</strong> — 인터넷등기소에서 누구나 발급 가능합니다.
                    실제 인도일과 정확히 같지는 않을 수 있지만 통상 비슷한 시기라 가장 접근하기 쉬운 근사치입니다.
                  </li>
                  <li style={{ marginBottom: "0.4rem" }}>
                    <strong>관리사무소 문의</strong> — 관리주체는 사업주체로부터 세대별 인도일을 넘겨받아 등록할
                    법적 의무가 있습니다(공동주택관리정보시스템 운영 관리규정 제15조④). 다만 실제 열람 절차나
                    제공 여부는 단지마다 다를 수 있습니다.
                  </li>
                  <li>
                    <strong>주택인도증서 원본</strong> — 최초 입주자가 입주 시 사업주체로부터 받은 서류입니다.
                    본인이 최초 입주자가 아니라면 구하기 어려울 수 있습니다.
                  </li>
                </ol>
                <p style={{ fontSize: "0.75rem", color: "#888" }}>
                  확실하지 않다면 입력하지 않아도 됩니다 — 사용승인일 기준 추정치로 계속 안내해드립니다.
                </p>
              </div>
            </details>
            <form method="get" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="date"
                name="handoverDate"
                defaultValue={handoverDate ?? ""}
                style={{ padding: "0.4rem 0.6rem", border: "1px solid #ccc", borderRadius: 6 }}
              />
              <button
                type="submit"
                style={{ padding: "0.4rem 1rem", background: "#171717", color: "#fff", borderRadius: 6, border: "none", cursor: "pointer" }}
              >
                적용
              </button>
              {handoverDate && (
                <a href={`/apt/${slug}`} style={{ fontSize: "0.85rem", color: "#666" }}>
                  초기화
                </a>
              )}
            </form>
            {result.jeonyuHandoverDateError && (
              <p style={{ fontSize: "0.8rem", color: "#b91c1c", marginTop: "0.5rem" }}>{result.jeonyuHandoverDateError}</p>
            )}
            <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.5rem" }}>
              입력한 날짜는 검증되지 않은 자기신고 값이며, 저장되지 않고 이 조회에만 사용됩니다.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.3rem" }}>
              전유부분 ({result.jeonyuHandoverDate ? "실제 인도일 기준 확정값" : "추정치"})
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
              {result.jeonyuHandoverDate
                ? `입력하신 실제 인도일(${result.jeonyuHandoverDate}) 기준으로 계산한 결과입니다.`
                : "실제 입주자 인도일이 아니라 사용승인일 기준으로 추정한 값입니다. 실제 인도일이 다르면 결과가 달라질 수 있습니다."}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.6rem" }}>공종</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>기간</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>{result.jeonyuHandoverDate ? "만료일" : "만료일(추정)"}</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {result.items
                  .filter((i) => i.part === "전유")
                  .map((i) => (
                    <ItemRow key={`${i.categoryCode}-전유`} item={i} />
                  ))}
              </tbody>
            </table>
          </section>

          {result.items.some((i) => i.caveat) && (
            <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: 8, marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              {result.items.find((i) => i.caveat)?.caveat}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "1.5rem" }}>{CALC_DISCLAIMER}</p>
    </div>
  );
}
