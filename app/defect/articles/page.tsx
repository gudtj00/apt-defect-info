import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { defectTypes, defectSource, getWarrantyCategory, getNamedSlugForCode } from "@/lib/defects";
import { Badge, Hero, FootNote } from "../../_components/ui";

export const metadata = {
  title: "조문별 전체 목록 | 하자 유형 검색",
  description: "공동주택 하자판정기준 고시 제7조~제44조(38개 조문) 전체 목록입니다.",
};

export default function DefectArticlesPage() {
  return (
    <div>
      <Hero
        badge={<Badge>국토교통부 고시 제7조~제44조</Badge>}
        title="하자판정기준"
        accent="38개 조문 전체"
        description="공동주택 하자의 조사, 보수비용 산정 및 하자판정기준 고시의 판정 조문 전체입니다. 담보책임기간은 공용부분 기준이며, 우리 아파트 잔여 기간은 계산기에서 확인하세요."
      />

      <div className="mx-auto max-w-3xl px-5 py-12">
        {/* 현재 탭 표시는 상단 메뉴가 맡는다. 여기는 돌아가는 길만 둔다. */}
        <Link
          href="/defect"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 no-underline hover:text-accent"
        >
          <ArrowLeftIcon size={14} weight="bold" aria-hidden="true" />
          증상으로 찾기
        </Link>

        <div className="mb-4 mt-4">
          <FootNote>
            기준: {defectSource.notice} · 확인일 {defectSource.verifiedAt}
          </FootNote>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-inset text-left">
                <th className="px-4 py-3 font-semibold text-ink">조문</th>
                <th className="px-4 py-3 font-semibold text-ink">유형</th>
                <th className="px-4 py-3 font-semibold text-ink">담보책임기간</th>
              </tr>
            </thead>
            <tbody>
              {defectTypes.map((t) => {
                const wc = getWarrantyCategory(t.warrantyCategoryCode);
                const linkSlug = getNamedSlugForCode(t.code) ?? t.code;
                return (
                  <tr key={t.code} className="border-b border-line-soft last:border-0 hover:bg-inset">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">{t.judgmentArticle}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/defect/${linkSlug}`}
                        className="font-medium text-ink no-underline hover:text-accent hover:underline"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className={"px-4 py-3 " + (wc ? "text-ink-2" : "text-ink-3")}>
                      {wc ? `${wc.name} · ${wc.years}년` : "해당 없음"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <FootNote>
            이 페이지가 제공하는 정보는 참고용이며 법률 자문이 아닙니다. 실제 하자 여부 판정은
            하자심사·분쟁조정위원회 또는 전문가 확인이 필요합니다.
          </FootNote>
        </div>
      </div>
    </div>
  );
}
