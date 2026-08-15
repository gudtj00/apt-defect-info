import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import NavLinks from "./_components/NavLinks";
import "./globals.css";

/**
 * 본문 글꼴.
 *
 * 그동안은 시스템 글꼴에 맡겨서 윈도우(맑은 고딕)·맥(애플 SD 산돌고딕)·안드로이드가
 * 서로 다른 모양으로 보였다. 법령 조문처럼 글자가 빽빽한 화면은 그 차이가 크다.
 * 본노토산스는 한글 자소 균형이 좋고 next/font가 빌드 때 받아서 직접 서빙하므로
 * 구글로 나가는 요청이 없다.
 *
 * subsets는 "미리 받아둘(preload) 구간"만 정한다. 한글 글리프는 unicode-range로
 * 쪼개진 채 함께 배포되고 필요한 조각만 브라우저가 받아간다.
 */
const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-hajapt-sans",
  fallback: ["Apple SD Gothic Neo", "Malgun Gothic", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "하잡 | 담보책임기간 계산기",
  description: "우리 아파트, 아직 하자보수 무상 청구가 가능한지 공종별로 확인하세요.",
  // Google Search Console 소유권 확인용. 확인이 끝나도 지우면 소유권이 풀리므로 유지한다.
  verification: {
    google: "KffZKk8iXI3worp9hcwx-gQDK8thqIWA_t9p22e62P0",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={sans.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-accent"
        >
          본문 바로가기
        </a>

        <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-[1.05rem] font-bold tracking-tight text-ink no-underline"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent">
                {/* 브랜드 마크 — 아이콘 라이브러리로 대체할 수 없는 자체 심볼이라 직접 그린다. */}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <path
                    d="M4 11.2 12 4l8 7.2"
                    stroke="var(--c-on-accent)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 10.3V19a1 1 0 0 0 1 1h4v-5.5h2V20h4a1 1 0 0 0 1-1v-8.7"
                    stroke="var(--c-on-accent)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="18" cy="17.5" r="4.2" fill="var(--c-on-accent)" />
                  <path
                    d="M16.4 17.6 17.5 18.7 19.6 16.4"
                    stroke="var(--c-accent)"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="flex items-baseline gap-1.5">
                하잡
                <span className="text-[0.65rem] font-medium tracking-wide text-ink-3">HAJAPT</span>
              </span>
            </Link>

            {/* 헤더 검색 — 자바스크립트 없이 동작하도록 평범한 GET 폼으로 둔다.
                탭이 6개라 폭이 빠듯하다. 탭이 한 줄에 다 들어가는 xl부터만 띄운다. */}
            <form action="/calculator" method="get" className="hidden min-w-0 flex-1 xl:block">
              <div className="relative">
                <MagnifyingGlassIcon
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  type="search"
                  name="q"
                  placeholder="단지명으로 검색"
                  aria-label="단지명 검색"
                  className="w-full rounded-full border border-line bg-inset py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:bg-surface focus:outline-none"
                />
              </div>
            </form>

            {/* 현재 탭 표시가 필요해 클라이언트 컴포넌트로 분리했다 (usePathname). */}
            <NavLinks />
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="mt-16 border-t border-line bg-surface px-5 py-8 text-sm text-ink-2">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>이 사이트가 제공하는 정보는 참고용이며 법률 자문이 아닙니다.</p>
            <p className="text-ink-3">
              기준 법령: 공동주택관리법 · 같은 법 시행령 · 공동주택 하자의 조사, 보수비용 산정 및 하자판정기준
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
