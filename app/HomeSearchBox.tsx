"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Suggestion = { slug: string; name: string; address: string };

export default function HomeSearchBox({ defaultValue }: { defaultValue: string }) {
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
      fetch(`/api/apt-suggest?q=${encodeURIComponent(trimmed)}`)
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
  }, [query]);

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
      {/* 검색 결과는 /calculator가 받는다 — 홈은 소개 페이지로 분리했다. */}
      <form method="get" action="/calculator" className="flex gap-2 rounded-full bg-slate-50 p-1.5 ring-1 ring-slate-200">
        <input
          type="text"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="예: 고덕센트럴 아이파크"
          autoComplete="off"
          className="flex-1 rounded-full border-none bg-transparent px-5 py-3.5 text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          aria-label="검색"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-emerald-700"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s.slug}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={
                  "block w-full px-5 py-3 text-left transition " + (i === highlight ? "bg-emerald-50" : "hover:bg-slate-50")
                }
              >
                <div className="font-semibold text-slate-900">{s.name}</div>
                <div className="text-sm text-slate-500">{s.address}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
