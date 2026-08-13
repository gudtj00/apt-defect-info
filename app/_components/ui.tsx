import Link from "next/link";

/**
 * 사이트 공통 레이아웃 프리미티브.
 *
 * 색은 에메랄드 하나만 강조색으로 쓰고 나머지는 흰색·슬레이트로 둔다.
 * (이전 홈은 타일마다 다른 그라데이션을 써서 페이지마다 톤이 달라졌다.)
 */

export function Badge({ children, dot = true }: { children: React.ReactNode; dot?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
      {children}
    </span>
  );
}

export function Hero({
  badge,
  title,
  accent,
  description,
  keywords,
  children,
}: {
  badge?: React.ReactNode;
  title: React.ReactNode;
  /** 타이틀 둘째 줄 — 강조색으로 표시된다. */
  accent?: React.ReactNode;
  description?: React.ReactNode;
  /** 가운뎃점으로 구분되는 짧은 키워드들. */
  keywords?: string[];
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
        {badge ? <div className="mb-6">{badge}</div> : null}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          {title}
          {accent ? (
            <>
              <br />
              <span className="text-emerald-600">{accent}</span>
            </>
          ) : null}
        </h1>
        {description ? (
          <p className="mx-auto mt-5 max-w-xl text-slate-500 sm:text-lg">{description}</p>
        ) : null}
        {keywords?.length ? (
          <p className="mt-3 text-sm font-semibold text-slate-700">{keywords.join(" • ")}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function HeroActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>;
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-emerald-700"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 no-underline shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

/** 아이콘 + 제목 + 설명 + 하단 분류 라벨로 이뤄진 카드. */
export function Card({
  href,
  icon,
  title,
  description,
  footer,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  footer?: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      {badge ? (
        <span className="absolute -top-2 right-4 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {badge}
        </span>
      ) : null}
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
        <span className="h-5 w-5">{icon}</span>
      </span>
      <span className="mt-4 text-[0.95rem] font-bold leading-snug text-slate-900">{title}</span>
      {description ? <span className="mt-1 text-xs leading-5 text-slate-500">{description}</span> : null}
      {footer ? (
        <span className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-emerald-600">{footer}</span>
      ) : null}
    </Link>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

/** 본문 페이지(설명·목록형)의 표준 래퍼. */
export function PageBody({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return <div className={`mx-auto ${wide ? "max-w-5xl" : "max-w-3xl"} px-5 py-10`}>{children}</div>;
}
