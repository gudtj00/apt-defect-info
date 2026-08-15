import Link from "next/link";

/**
 * 사이트 공통 레이아웃 프리미티브.
 *
 * 색은 globals.css의 의미 토큰만 쓴다. 여기서 slate-500 같은 원색을 직접 쓰면
 * 다크 모드에서 그 부분만 안 따라온다.
 *
 * 모서리 규칙 — 섞여 있으면 화면이 흔들려 보여서 세 단계로 고정했다.
 *   · 누르는 것(버튼·탭·입력·칩·막대)  → rounded-full
 *   · 면(카드·패널·안내 상자)          → rounded-2xl
 *   · 면 안의 작은 요소(아이콘 타일·표) → rounded-lg
 */

/** 히어로 위에 붙는 근거 표시. 어느 법령을 기준으로 한 화면인지 밝히는 용도다. */
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-2">
      {children}
    </span>
  );
}

export function Hero({
  badge,
  title,
  accent,
  description,
  children,
}: {
  badge?: React.ReactNode;
  title: React.ReactNode;
  /** 타이틀 둘째 줄 — 강조색으로 표시된다. */
  accent?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line bg-surface">
      {/* 위 여백을 너무 주면 첫 화면에서 제목이 아래로 떠 보인다. pt-14/pt-20 선에서 멈춘다. */}
      <div className="mx-auto max-w-3xl px-5 pb-14 pt-14 text-center sm:pb-20 sm:pt-20">
        {badge ? <div className="mb-6">{badge}</div> : null}
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          {title}
          {accent ? (
            <>
              <br />
              <span className="text-accent">{accent}</span>
            </>
          ) : null}
        </h1>
        {description ? (
          <p className="mx-auto mt-5 max-w-xl leading-8 text-ink-2 sm:text-lg">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function HeroActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>;
}

/* 누를 때 1px 눌리는 느낌을 준다. 실제로 눌렸는지 알기 어렵다는 피드백이 흔한 지점이다. */
const PRESS = "transition active:translate-y-px";

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent no-underline hover:bg-accent-hover ${PRESS}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink no-underline hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink ${PRESS}`}
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
      <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {description ? <p className="mt-2 leading-7 text-ink-2">{description}</p> : null}
    </div>
  );
}

/** 출처·면책처럼 화면 끝에 붙는 작은 글. */
export function FootNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-6 text-ink-3">{children}</p>;
}
