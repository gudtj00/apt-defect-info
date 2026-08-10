"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DefectSearchItem } from "@/lib/defects";

function scoreItem(item: DefectSearchItem, tokens: string[]): number {
  const haystack = `${item.name} ${item.tags.join(" ")} ${item.explanation} ${item.keywords} ${item.article}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1;
    if (item.name.toLowerCase().includes(token)) score += 2;
  }
  return score;
}

export default function DefectSearch({ items }: { items: DefectSearchItem[] }) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const isFloorNoiseQuery = trimmed.includes("층간소음");

  const results = useMemo(() => {
    if (!trimmed || isFloorNoiseQuery) return [];
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    return items
      .map((item) => ({ item, score: scoreItem(item, tokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.item);
  }, [items, trimmed, isFloorNoiseQuery]);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 벽지 들뜸, 물이 새요, 창문이 안 닫혀요"
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {isFloorNoiseQuery && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          층간소음은 이 고시(하자판정기준)가 다루는 대상이 아닙니다. 「공동주택 층간소음의 범위와 기준에 관한
          규칙」등 별도 기준으로 다뤄지는 사안이라, 이 서비스에서는 안내해드릴 수 없습니다.
        </div>
      )}

      {trimmed && !isFloorNoiseQuery && results.length === 0 && (
        <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          관련된 하자 유형을 찾지 못했습니다. 아래 현상별 목록에서 찾아보시거나, 표현을 바꿔 다시 검색해보세요.
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {results.map((item) => (
            <li key={item.code}>
              <Link
                href={`/defect/${item.slug}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-inherit no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {item.article}({item.name})
                  </span>
                  {item.tags.length > 0 && (
                    <span className="shrink-0 text-xs text-emerald-600">{item.tags.join(" · ")}</span>
                  )}
                </div>
                {item.explanation && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.explanation}</p>
                )}
              </Link>
            </li>
          ))}
          <li className="pt-1 text-center text-xs text-slate-400">
            정확한 하자 여부 판정은 하자심사·분쟁조정위원회 또는 전문가 확인이 필요합니다.
          </li>
        </ul>
      )}
    </div>
  );
}
