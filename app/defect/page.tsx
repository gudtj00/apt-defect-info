import Link from "next/link";
import {
  phenomena,
  defectSource,
  getDefectSearchIndex,
  PHENOMENON_SLUG,
} from "@/lib/defects";
import DefectSearch from "./DefectSearch";
import { Badge, Hero } from "../_components/ui";

export const metadata = {
  title: "하자 유형 검색 — 하잡",
  description: "증상을 입력하면 관련된 공동주택 하자판정기준 조문을 안내해드립니다.",
};

export default function DefectIndexPage() {
  const items = getDefectSearchIndex();
  const maxShare = Math.max(...phenomena.ranking.map((p) => p.share));

  return (
    <div>
      <Hero
        badge={<Badge>공동주택 하자판정기준 38개 조문</Badge>}
        title="내 집 증상,"
        accent="어떤 하자에 해당할까?"
        description="증상을 입력하면 관련된 하자판정기준 조문을 찾아드립니다. 하자 여부를 판정하는 것이 아니라, 관련 있을 만한 기준을 안내하는 정보매칭 서비스입니다."
      />

      {/* 화면 전체 너비 2단 섹션 — 왼쪽 현상별로 찾아보기 / 오른쪽 위(증상으로 찾기)-아래(조문으로 찾기) */}
      <section className="grid w-full md:grid-cols-2">
        <div className="bg-slate-50 p-8 sm:px-14 sm:py-12 md:min-h-[560px]">
          <h2 className="text-2xl font-extrabold text-slate-900">현상별로 찾아보기</h2>
          <p className="mt-2 text-slate-500">
            하자심사·분쟁조정위원회 통계 기준 발생 빈도입니다 (2021년~2026년 2월 누적{" "}
            {phenomena.note.match(/([\d,]+)건 접수/)?.[1] ?? ""}건 접수 기준).
          </p>
          <ul className="mt-6 flex flex-col gap-4">
            {phenomena.ranking.map((p) => {
              const slug = PHENOMENON_SLUG[p.name];
              const widthPct = (p.share / maxShare) * 100;
              const body = (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-slate-900">
                      <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[0.7rem] font-bold text-white">
                        {p.rank}
                      </span>
                      {p.name}
                    </span>
                    <span className="font-semibold text-emerald-700">{(p.share * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${widthPct}%` }} />
                  </div>
                  {!slug && (
                    <div className="mt-1 text-xs text-amber-700">
                      아직 정리된 설명 페이지가 없습니다 — 증상 검색에서 관련 조문을 직접 찾아보세요.
                    </div>
                  )}
                </>
              );
              const className = "block rounded-xl px-1 py-1 no-underline text-inherit transition " + (slug ? "hover:opacity-80" : "");
              return (
                <li key={p.name}>
                  {slug ? (
                    <Link href={`/defect/${slug}`} className={className}>
                      {body}
                    </Link>
                  ) : (
                    <div className={className}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 px-8 py-10 text-white sm:px-14 md:min-h-[280px]">
            <h2 className="text-2xl font-extrabold">증상으로 찾기</h2>
            <p className="mt-2 text-emerald-50">겪고 있는 증상을 입력하면 관련 조문을 찾아드려요</p>
            <div className="mt-5 max-w-md">
              <DefectSearch items={items} />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-slate-800 to-slate-950 px-8 py-10 text-white sm:px-14 md:min-h-[280px]">
            <h2 className="text-2xl font-extrabold">조문으로 찾기</h2>
            <p className="mt-2 text-slate-300">제7조~제44조, 38개 판정 조문을 전부 찾아볼 수 있어요</p>
            <Link
              href="/defect/articles"
              className="mt-5 inline-flex w-fit items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 no-underline hover:bg-white/90"
            >
              전체 조문 목록 보기 →
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-8">
        <p className="text-xs text-slate-400">
          기준: {defectSource.notice} · 확인일 {defectSource.verifiedAt}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          이 페이지가 제공하는 정보는 참고용이며 법률 자문이 아닙니다. 실제 하자 여부 판정은 하자심사·분쟁조정위원회
          또는 전문가 확인이 필요합니다.
        </p>
      </div>
    </div>
  );
}
