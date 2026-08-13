import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "./_components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "하잡 — 담보책임기간 계산기",
  description: "우리 아파트, 아직 하자보수 무상 청구가 가능한지 공종별로 확인하세요.",
  // Google Search Console 소유권 확인용. 확인이 끝나도 지우면 소유권이 풀리므로 유지한다.
  verification: {
    google: "KffZKk8iXI3worp9hcwx-gQDK8thqIWA_t9p22e62P0",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-[1.05rem] font-extrabold tracking-tight text-slate-900 no-underline">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path
                    d="M4 11.2 12 4l8 7.2"
                    stroke="white"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 10.3V19a1 1 0 0 0 1 1h4v-5.5h2V20h4a1 1 0 0 0 1-1v-8.7"
                    stroke="white"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="18" cy="17.5" r="4.2" fill="white" />
                  <path
                    d="M16.4 17.6 17.5 18.7 19.6 16.4"
                    stroke="#059669"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="flex items-baseline gap-1.5">
                하잡
                <span className="text-[0.65rem] font-semibold tracking-wide text-slate-400">HAJAPT</span>
              </span>
            </Link>
            {/* 헤더 검색 — 자바스크립트 없이 동작하도록 평범한 GET 폼으로 둔다.
                홈에 큰 검색창이 따로 있으므로 좁은 화면에서는 숨긴다. */}
            <form action="/calculator" method="get" className="hidden min-w-0 flex-1 lg:block">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  name="q"
                  placeholder="단지명으로 검색…"
                  aria-label="단지명 검색"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </form>

            {/* 현재 탭 표시가 필요해 클라이언트 컴포넌트로 분리했다 (usePathname). */}
            <NavLinks />
          </div>
        </nav>
        <main>{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
          <div className="mx-auto max-w-5xl">
            <p>이 사이트가 제공하는 정보는 참고용이며 법률 자문이 아닙니다.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
