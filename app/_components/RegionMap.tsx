"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { REGIONS, REGION_VIEWBOX, shortName } from "@/lib/regions";

/**
 * 시도 지도로 지역을 좁히는 선택기.
 *
 * 접근성 때문에 두 겹으로 만들었다.
 *  · SVG는 포인터로 고르는 용도이고 보조기술에는 숨긴다(aria-hidden).
 *    지도 도형은 스크린리더로 읽을 수 없고, 세종·서울처럼 작은 구역은
 *    손가락으로 정확히 누르기도 어렵다.
 *  · 진짜 컨트롤은 아래 지역 칩이다. 평범한 링크라서 키보드·스크린리더·
 *    새 탭 열기가 전부 그냥 된다. 좁은 화면에서는 지도를 숨기고 칩만 남긴다.
 *
 * 선택 결과는 URL(?region=)에 담는다. 공유·뒤로가기가 그대로 동작하고
 * 결과 목록은 서버에서 걸러진다.
 */
export default function RegionMap({
  selected,
  query,
}: {
  /** 현재 선택된 지역. DB의 region 문자열. */
  selected?: string;
  /** 지역을 바꿔도 입력해 둔 검색어는 유지한다. */
  query?: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  const hrefFor = (region: string | null) => {
    const p = new URLSearchParams();
    if (region) p.set("region", region);
    if (query) p.set("q", query);
    const qs = p.toString();
    return qs ? `/calculator?${qs}` : "/calculator";
  };

  // 지도에서 이름표는 가리키는 지역 하나만 띄운다.
  // 16개를 전부 얹으면 서울·인천, 대전·세종처럼 붙어 있는 곳에서 글자가 겹친다.
  const active = hovered ?? selected ?? null;
  const activeRegion = REGIONS.find((r) => r.region === active);

  return (
    <div>
      {/* 지도 위에서 가리키는 지역을 글로도 알려준다. 색만으로 전달하지 않기 위함. */}
      <p className="mb-3 flex min-h-6 items-baseline gap-2 text-sm" aria-hidden="true">
        {activeRegion ? (
          <>
            <span className="font-bold text-ink">{activeRegion.region}</span>
            <span className="tnum text-ink-2">{activeRegion.count.toLocaleString()}개 단지</span>
          </>
        ) : (
          <span className="text-ink-3">지역을 선택하면 그 안에서만 찾습니다</span>
        )}
      </p>

      <svg
        viewBox={REGION_VIEWBOX}
        role="presentation"
        aria-hidden="true"
        className="region-map mx-auto hidden h-auto max-h-[420px] w-full sm:block"
        onMouseLeave={() => setHovered(null)}
      >
        {REGIONS.map((r, i) => {
          const isSelected = selected === r.region;
          const isActive = active === r.region;
          return (
            <path
              key={r.region}
              d={r.d}
              className={`region-path ${isSelected ? "is-selected" : ""} ${
                selected && !isSelected ? "is-muted" : ""
              }`}
              style={{ animationDelay: `${i * 22}ms` }}
              onMouseEnter={() => setHovered(r.region)}
              onClick={() => router.push(hrefFor(isSelected ? null : r.region))}
            >
              {/* 마우스만 쓰는 사용자를 위한 기본 툴팁 */}
              <title>{`${r.region} ${r.count.toLocaleString()}개 단지`}</title>
            </path>
          );
        })}

        {activeRegion ? (
          <g className="region-label" aria-hidden="true">
            <text
              x={activeRegion.labelX}
              y={activeRegion.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {shortName(activeRegion.region)}
            </text>
          </g>
        ) : null}
      </svg>

      {/* 실제 컨트롤. 지도를 못 쓰는 상황에서도 이것만으로 전부 된다. */}
      <nav aria-label="지역 선택" className="mt-4 sm:mt-5">
        <ul className="flex flex-wrap gap-1.5">
          {selected ? (
            <li>
              <Link
                href={hrefFor(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink-2 no-underline transition hover:text-ink active:translate-y-px"
              >
                <XIcon size={12} weight="bold" aria-hidden="true" />
                전체
              </Link>
            </li>
          ) : null}
          {REGIONS.map((r) => {
            const isSelected = selected === r.region;
            return (
              <li key={r.region}>
                <Link
                  href={hrefFor(isSelected ? null : r.region)}
                  aria-current={isSelected ? "true" : undefined}
                  onMouseEnter={() => setHovered(r.region)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(r.region)}
                  onBlur={() => setHovered(null)}
                  className={`inline-flex items-baseline gap-1.5 rounded-full border px-3 py-1.5 text-sm no-underline transition active:translate-y-px ${
                    isSelected
                      ? "border-accent bg-accent font-semibold text-on-accent"
                      : "border-line bg-surface text-ink-2 hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink"
                  }`}
                >
                  {shortName(r.region)}
                  <span className={`tnum text-xs ${isSelected ? "opacity-80" : "text-ink-3"}`}>
                    {r.count.toLocaleString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
