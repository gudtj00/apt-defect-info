import type { Metadata } from "next";
import Link from "next/link";
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
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
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
            {/* 좁은 화면에서는 5개가 한 줄에 안 들어가므로 가로 스크롤로 둔다 —
                버튼 스타일을 걷어내면서 모바일에서 메뉴가 아예 사라지지 않게 하기 위함. */}
            <div className="flex items-center gap-4 overflow-x-auto text-sm sm:gap-6">
              <Link
                href="/"
                className="shrink-0 whitespace-nowrap text-slate-600 no-underline hover:text-emerald-600"
              >
                담보책임기간 계산기
              </Link>
              <Link
                href="/defect"
                className="shrink-0 whitespace-nowrap text-slate-600 no-underline hover:text-emerald-600"
              >
                하자 유형 검색
              </Link>
              <Link
                href="/claim"
                className="shrink-0 whitespace-nowrap text-slate-600 no-underline hover:text-emerald-600"
              >
                청구 절차
              </Link>
              <Link
                href="/faq"
                className="shrink-0 whitespace-nowrap text-slate-600 no-underline hover:text-emerald-600"
              >
                자주 묻는 질문
              </Link>
              <Link
                href="/defect/articles"
                className="shrink-0 whitespace-nowrap text-slate-600 no-underline hover:text-emerald-600"
              >
                전체 조문 목록
              </Link>
            </div>
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
