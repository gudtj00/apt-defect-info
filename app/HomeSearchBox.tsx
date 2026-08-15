"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

type Suggestion = { slug: string; name: string; address: string };

export default function HomeSearchBox({
  defaultValue,
  region,
}: {
  defaultValue: string;
  /** 지도에서 지역을 골랐다면 자동완성과 폼 제출 모두 그 안으로 좁힌다. */
  region?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: trimmed, ...(region ? { region } : {}) });
      fetch(`/api/apt-suggest?${params}`)
        .then((r) => r.json())
        .then((data: Suggestion[]) => {
          setSuggestions(data);
          setOpen(data.length > 0);
          setHighlight(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [query, region]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(s: Suggestion) {
    setOpen(false);
    router.push(`/apt/${s.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlight]);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* 검색 결과는 /calculator가 받는다. 홈은 소개 페이지로 분리했다. */}
      <form method="get" action="/calculator">
        {/* 자바스크립트 없이 폼을 그냥 제출해도 고른 지역이 유지되게 한다. */}
        {region ? <input type="hidden" name="region" value={region} /> : null}
        {/* 입력란의 이름을 placeholder로만 알리면 글자를 넣는 순간 사라진다. 라벨을 따로 둔다. */}
        <label htmlFor="apt-q" className="mb-2 block text-sm font-semibold text-ink">
          단지명
        </label>
        <div className="flex gap-2 rounded-full border border-line bg-inset p-1.5">
          <input
            id="apt-q"
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="예: 고덕센트럴 아이파크"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="apt-suggest-list"
            className="min-w-0 flex-1 rounded-full border-none bg-transparent px-5 py-3.5 text-base text-ink outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            aria-label="검색"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition hover:bg-accent-hover active:translate-y-px"
          >
            <MagnifyingGlassIcon size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="apt-suggest-list"
          role="listbox"
          className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-slate-900/5"
        >
          {suggestions.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={
                  "block w-full px-5 py-3 text-left transition " +
                  (i === highlight ? "bg-accent-soft" : "hover:bg-inset")
                }
              >
                <div className="font-semibold text-ink">{s.name}</div>
                <div className="text-sm text-ink-2">{s.address}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
