import Link from "next/link";
import { defectTypes, defectSource, getWarrantyCategory, getNamedSlugForCode } from "@/lib/defects";
import { Badge, Hero } from "../../_components/ui";

export const metadata = {
  title: "조문별 전체 목록 — 하자 유형 검색",
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

      <div className="mx-auto max-w-3xl px-5 py-10">
      <nav className="mb-6 flex gap-2 text-sm">
        <Link
          href="/defect"
          className="rounded-full px-4 py-1.5 font-semibold text-slate-500 no-underline hover:bg-white hover:text-emerald-600"
        >
          ← 증상으로 찾기
        </Link>
        <span className="rounded-full bg-emerald-600 px-4 py-1.5 font-semibold text-white">전체 조문 목록</span>
      </nav>

      <p className="mb-4 text-xs text-slate-400">
        기준: {defectSource.notice} · 확인일 {defectSource.verifiedAt}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-700">조문</th>
              <th className="px-4 py-3 font-semibold text-slate-700">유형</th>
              <th className="px-4 py-3 font-semibold text-slate-700">담보책임기간</th>
            </tr>
          </thead>
          <tbody>
            {defectTypes.map((t) => {
              const wc = getWarrantyCategory(t.warrantyCategoryCode);
              const linkSlug = getNamedSlugForCode(t.code) ?? t.code;
              return (
                <tr key={t.code} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{t.judgmentArticle}</td>
                  <td className="px-4 py-3">
                    <Link href={`/defect/${linkSlug}`} className="font-medium text-slate-900 no-underline hover:text-emerald-600">
                      {t.name}
                    </Link>
                  </td>
                  <td className={"px-4 py-3 " + (wc ? "text-slate-700" : "text-slate-400")}>
                    {wc ? `${wc.name} · ${wc.years}년` : "해당 없음"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        이 페이지가 제공하는 정보는 참고용이며 법률 자문이 아닙니다. 실제 하자 여부 판정은 하자심사·분쟁조정위원회
        또는 전문가 확인이 필요합니다.
      </p>
      </div>
    </div>
  );
}
