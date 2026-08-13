"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 현재 보고 있는 탭을 표시하는 네비게이션.
 *
 * 경로 매칭을 단순 startsWith로 하면 안 된다 — `/defect/articles`(전체 조문 목록)가
 * `/defect`(하자 유형 검색)로 시작해서 두 탭이 동시에 켜진다. 그래서 항목마다
 * 판정 함수를 따로 둔다.
 */
const NAV: { href: string; label: string; isActive: (path: string) => boolean }[] = [
  {
    href: "/",
    label: "홈",
    isActive: (p) => p === "/",
  },
  {
    href: "/calculator",
    label: "담보책임기간 계산기",
    // 단지 상세(/apt/...)는 계산기에서 이어지는 화면이므로 같은 탭으로 본다.
    isActive: (p) => p.startsWith("/calculator") || p.startsWith("/apt"),
  },
  {
    href: "/defect",
    label: "하자 유형 검색",
    // 개별 하자 유형 페이지(/defect/leak 등)는 포함하되 조문 목록은 제외한다.
    isActive: (p) => p === "/defect" || (p.startsWith("/defect/") && p !== "/defect/articles"),
  },
  {
    href: "/claim",
    label: "청구 절차",
    isActive: (p) => p.startsWith("/claim"),
  },
  {
    href: "/faq",
    label: "자주 묻는 질문",
    isActive: (p) => p.startsWith("/faq"),
  },
  {
    href: "/defect/articles",
    label: "전체 조문 목록",
    isActive: (p) => p === "/defect/articles",
  },
];

export default function NavLinks() {
  const pathname = usePathname() ?? "/";

  return (
    // 좁은 화면에서는 5개가 한 줄에 안 들어가므로 가로 스크롤로 둔다.
    <div className="flex items-center gap-1 overflow-x-auto text-sm sm:gap-2">
      {NAV.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            // 활성/비활성 모두 같은 여백을 줘서 이동할 때 글자 위치가 흔들리지 않게 한다.
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 no-underline transition ${
              active
                ? "bg-emerald-50 font-semibold text-emerald-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
