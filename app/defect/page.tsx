import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import {
  phenomena,
  defectSource,
  getDefectSearchIndex,
  PHENOMENON_SLUG,
} from "@/lib/defects";
import DefectSearch from "./DefectSearch";
import { Badge, Hero, FootNote } from "../_components/ui";

export const metadata = {
  title: "하자 유형 검색 | 하잡",
  description: "증상을 입력하면 관련된 공동주택 하자판정기준 조문을 안내해드립니다.",
};

export default function DefectIndexPage() {
  const items = getDefectSearchIndex();
  const maxShare = Math.max(...phenomena.ranking.map((p) => p.share));
  const caseCount = phenomena.note.match(/([\d,]+)건 접수/)?.[1] ?? "";

  return (
    <div>
      <Hero
        badge={<Badge>공동주택 하자판정기준 38개 조문</Badge>}
        title="내 집 증상,"
        accent="어떤 하자에 해당할까?"
        description="증상을 입력하면 관련된 하자판정기준 조문을 찾아드립니다. 하자 여부를 판정하는 것이 아니라, 관련 있을 만한 기준을 안내하는 정보매칭 서비스입니다."
      />

      {/* 화면 전체 너비 2단 구성.
          왼쪽은 "무엇이 많이 생기나"(둘러보기), 오른쪽은 "내 것을 찾는다"(행동).
          예전에는 양쪽에 초록·검정 그라데이션을 깔았는데, 페이지 중간에서 테마가
          뒤집혀 보였다. 이제 면은 토큰 한 벌로 통일하고 마지막 칸만 어둡게 둔다. */}
      <section className="grid w-full items-stretch md:grid-cols-2">
        <div className="bg-canvas px-6 py-12 sm:px-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink">현상별로 찾아보기</h2>
          <p className="mt-2 leading-7 text-ink-2">
            하자심사·분쟁조정위원회 통계 기준 발생 빈도입니다 (2021년~2026년 2월 누적 {caseCount}건 접수 기준).
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {phenomena.ranking.map((p) => {
              const slug = PHENOMENON_SLUG[p.name];
              const widthPct = (p.share / maxShare) * 100;
              const body = (
                <>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">
                      <span className="tnum mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[0.7rem] font-bold text-on-accent">
                        {p.rank}
                      </span>
                      {p.name}
                    </span>
                    <span className="tnum font-semibold text-accent">{(p.share * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-inset">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${widthPct}%` }} />
                  </div>
                  {!slug && (
                    <div className="mt-1.5 text-xs text-ink-3">
                      아직 정리된 설명 페이지가 없습니다. 증상 검색에서 관련 조문을 직접 찾아보세요.
                    </div>
                  )}
                </>
              );
              return (
                <li key={p.name}>
                  {slug ? (
                    <Link
                      href={`/defect/${slug}`}
                      className="block rounded-lg px-1 py-1 text-inherit no-underline transition hover:opacity-70"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="px-1 py-1">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-1 flex-col justify-center border-t border-line bg-surface px-6 py-12 sm:px-14 md:border-l md:border-t-0">
            <h2 className="text-2xl font-bold tracking-tight text-ink">증상으로 찾기</h2>
            <p className="mt-2 leading-7 text-ink-2">겪고 있는 증상을 입력하면 관련 조문을 찾아드립니다.</p>
            <div className="mt-5 max-w-md">
              <DefectSearch items={items} />
            </div>
          </div>

          {/* 페이지에서 유일하게 어두운 칸. 조문 전문으로 들어가는 입구라 무게를 준다. */}
          <div className="flex flex-1 flex-col justify-center bg-deep px-6 py-12 sm:px-14">
            <h2 className="text-2xl font-bold tracking-tight text-deep-ink">조문으로 찾기</h2>
            <p className="mt-2 leading-7 text-deep-ink-2">
              제7조~제44조, 38개 판정 조문을 전부 찾아볼 수 있습니다.
            </p>
            <Link
              href="/defect/articles"
              // 어두운 칸 위라 밝은 초록 채움 + 어두운 글자로 뒤집는다. 짙은 초록은 배경에 묻힌다.
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-deep-accent px-5 py-2.5 text-sm font-semibold text-deep no-underline transition hover:opacity-90 active:translate-y-px"
            >
              전체 조문 목록 보기
              <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-2 px-5 py-10">
        <FootNote>
          기준: {defectSource.notice} · 확인일 {defectSource.verifiedAt}
        </FootNote>
        <FootNote>
          이 페이지가 제공하는 정보는 참고용이며 법률 자문이 아닙니다. 실제 하자 여부 판정은
          하자심사·분쟁조정위원회 또는 전문가 확인이 필요합니다.
        </FootNote>
      </div>
    </div>
  );
}
