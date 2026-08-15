"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤해서 화면에 들어올 때 나타나는 래퍼.
 *
 * 원칙: 내용이 안 보이는 상태로 남는 경우가 절대 없어야 한다.
 * 이 사이트는 정보 전달이 목적이라 연출보다 가독이 우선이다.
 *
 * 그래서 세 겹으로 막는다.
 *  1) 서버 렌더 결과는 항상 보이는 상태다 — JS가 없으면 그대로 다 보인다.
 *  2) 마운트 후에도 IntersectionObserver가 살아있다고 확인되기 전까지는 숨기지 않는다.
 *     (관찰 시작 시 브라우저가 초기 상태 콜백을 한 번 주는 것을 신호로 삼는다.)
 *  3) 그 신호가 일정 시간 안에 오지 않으면 연출을 포기하고 전부 보여준다.
 *     실제로 콜백이 오지 않는 환경이 있었고, 그때 화면이 비어버렸다.
 */
const HEALTH_CHECK_MS = 800;

export default function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    let sawCallback = false;

    const io = new IntersectionObserver(
      (entries) => {
        if (!alive) return;
        // 첫 콜백이 왔다는 것 자체가 "관찰자가 동작한다"는 신호다.
        if (!sawCallback) {
          sawCallback = true;
          const entry = entries[0];
          // 이미 화면 안이면 굳이 숨겼다 보여주지 않는다.
          if (!entry.isIntersecting) setHidden(true);
        }
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHidden(false);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    io.observe(el);

    // 콜백이 아예 오지 않는 환경 대비 — 연출을 포기하고 보이게 둔다.
    const failsafe = window.setTimeout(() => {
      if (!sawCallback) {
        alive = false;
        io.disconnect();
        setHidden(false);
      }
    }, HEALTH_CHECK_MS);

    return () => {
      alive = false;
      window.clearTimeout(failsafe);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: hidden ? "0ms" : `${delay}ms` }}
      // 정보 전달이 목적인 화면이라 연출은 최소로 둔다. 시선이 따라오는 정도면 충분하다.
      className={`transition-all duration-500 ease-out ${
        hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
