"use client";

import { useMemo, useState } from "react";

// 입력값은 전부 브라우저 안에서만 쓰이고 서버로 보내지 않는다. 개인정보를 받아두지 않기 위함.
// (청구서에는 이름·주소·연락처가 들어가므로 전송/저장하지 않는 편이 안전하다.)

type Fields = {
  builder: string;
  complex: string;
  unit: string;
  name: string;
  contact: string;
  place: string;
  detail: string;
  foundAt: string;
};

const EMPTY: Fields = {
  builder: "",
  complex: "",
  unit: "",
  name: "",
  contact: "",
  place: "",
  detail: "",
  foundAt: "",
};

const PLACEHOLDER: Fields = {
  builder: "○○건설 주식회사",
  complex: "○○아파트",
  unit: "101동 1001호",
  name: "○○○",
  contact: "010-0000-0000",
  place: "안방 천장",
  detail: "천장 모서리를 따라 물이 스며든 자국이 번지고 있으며, 비가 온 다음 날 특히 심해집니다.",
  foundAt: "2026-08-01",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  textarea?: boolean;
  type?: string;
}) {
  const base =
    "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none";
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-2">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={base}
        />
      ) : (
        <input
          type={type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </label>
  );
}

function formatKoreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
}

export default function ClaimLetter() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const set = (k: keyof Fields) => (v: string) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setCopied(false);
    setCopyFailed(false);
  };

  // 비어 있는 칸은 예시값으로 채워서 보여준다. 처음부터 완성된 문서 형태를 보게 하려는 것.
  const v = useMemo(() => {
    const out = {} as Fields;
    (Object.keys(EMPTY) as (keyof Fields)[]).forEach((k) => {
      out[k] = f[k].trim() || PLACEHOLDER[k];
    });
    return out;
  }, [f]);

  const letter = useMemo(() => {
    const found = formatKoreanDate(v.foundAt);
    return `하자보수 청구서

수신: ${v.builder} 귀중
발신: ${v.name} (${v.complex} ${v.unit})
연락처: ${v.contact}

1. 본인은 위 주소지 공동주택의 입주자입니다.

2. 아래와 같은 하자가 발생하여 「공동주택관리법」 제37조 및 같은 법 시행령
   제38조에 따라 하자보수를 청구합니다.

   - 하자 발생 위치: ${v.place}
   - 하자 내용: ${v.detail}
   - 발견 일자: ${found}

3. 「공동주택관리법 시행령」 제38조제3항에 따라, 이 청구를 받은 날부터 15일
   이내에 하자를 보수하시거나 하자보수계획(하자 부위, 보수 방법, 보수에 필요한
   기간, 담당자 성명 및 연락처를 포함)을 서면으로 통보하여 주시기 바랍니다.
   하자에 해당하지 않는다고 판단하시는 경우에도 같은 항 단서에 따라 그 이유를
   서면으로 회신하여 주시기 바랍니다.

4. 회신은 위 연락처로 부탁드립니다.

첨부: 하자 부위 사진 ○매

${formatKoreanDate(new Date().toISOString().slice(0, 10))}

청구인 ${v.name} (인)`;
  }, [v]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };

  const filledCount = (Object.keys(EMPTY) as (keyof Fields)[]).filter((k) => f[k].trim()).length;

  const totalFields = Object.keys(EMPTY).length;

  // 제목은 바깥 단 제목(<h2>청구서 만들기</h2>)이 맡는다. 여기서 또 붙이면 두 번 나온다.
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <p className="text-xs leading-6 text-ink-2">
          아래를 채우면 청구서가 완성됩니다. 비워 두면 예시 문구가 그대로 들어가니, 보내기 전에 모두 내 상황에
          맞게 바꿔 주세요. 입력한 내용은 이 브라우저 안에서만 쓰이고 어디에도 저장되거나 전송되지 않습니다.
        </p>

        {/* 공식 서식으로 오해하지 않도록 성격을 명시한다.
            확인 결과: 시행규칙에 서식 58종이 있으나 하자보수 청구에 대응하는 서식은 없고,
            시행령 제38조도 다른 신청·신고 절차와 달리 "국토교통부령으로 정하는 서식" 문구가 없다. */}
        <div className="mt-3 rounded-lg border border-line bg-inset px-3 py-2.5">
          <p className="text-xs leading-6 text-ink-2">
            <strong className="font-semibold text-ink">이 양식은 법정 서식이 아닙니다.</strong> 하자보수
            청구에는 법으로 정해진 서식이 없습니다. 공동주택관리법 시행령 제38조는 청구할 의무만 정하고 형식은
            따로 정하지 않았습니다(같은 법 시행규칙에 주택인도증서·담보책임 종료확인서 등의 서식은 있지만 청구서
            서식은 없습니다). 아래 양식은 그 조문에 맞춰 참고용으로 구성한 것이며, 형식이 달라도 필요한 내용만
            담겨 있으면 청구의 효력에는 문제가 없습니다.
          </p>
        </div>
      </div>

      {/* 옆단에 고정돼 있으면 미리보기가 화면 밖으로 밀릴 때가 있다.
          몇 칸이 남았는지는 입력란 옆에서 바로 보이게 둔다. */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset"
          role="img"
          aria-label={`${totalFields}칸 중 ${filledCount}칸 입력함`}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${(filledCount / totalFields) * 100}%` }}
          />
        </div>
        <span className="tnum shrink-0 text-xs font-semibold text-ink-2">
          {filledCount} / {totalFields}
        </span>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
        <Field label="시공사(사업주체) 이름" value={f.builder} onChange={set("builder")} placeholder={PLACEHOLDER.builder} />
        <Field label="단지명" value={f.complex} onChange={set("complex")} placeholder={PLACEHOLDER.complex} />
        <Field label="동·호수" value={f.unit} onChange={set("unit")} placeholder={PLACEHOLDER.unit} />
        <Field label="청구인 이름" value={f.name} onChange={set("name")} placeholder={PLACEHOLDER.name} />
        <Field label="연락처" value={f.contact} onChange={set("contact")} placeholder={PLACEHOLDER.contact} />
        <Field label="하자를 발견한 날짜" value={f.foundAt} onChange={set("foundAt")} placeholder={PLACEHOLDER.foundAt} type="date" />
        <div className="sm:col-span-2">
          <Field label="하자 발생 위치" value={f.place} onChange={set("place")} placeholder={PLACEHOLDER.place} />
        </div>
        <div className="sm:col-span-2">
          <Field label="하자 내용" value={f.detail} onChange={set("detail")} placeholder={PLACEHOLDER.detail} textarea />
        </div>
      </div>

      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-ink-2">
            완성된 청구서
            {filledCount === 0 ? (
              <span className="ml-1 font-normal text-ink-3">(아래는 예시입니다)</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition hover:bg-accent-hover active:translate-y-px"
          >
            {copied ? "복사됨" : "복사하기"}
          </button>
        </div>
        {/* 클립보드 접근이 막히는 브라우저·환경이 있다. 조용히 실패하면 복사된 줄 알고 넘어간다. */}
        {copyFailed ? (
          <p role="status" className="mt-2 text-xs leading-6 text-warn-ink">
            자동 복사가 차단됐습니다. 아래 내용을 직접 선택해 복사해 주세요.
          </p>
        ) : null}
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-inset p-4 text-xs leading-6 text-ink-2">
          {letter}
        </pre>
      </div>

      <div className="border-t border-line bg-inset px-4 py-3">
        <p className="text-xs font-semibold text-ink-2">보내는 방법</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-6 text-ink-2">
          <li>
            우체국 <strong className="font-semibold text-ink">내용증명</strong>으로 보내면 어떤 내용을 언제
            보냈는지가 증명됩니다. 15일이 언제부터 시작됐는지 다투게 될 때 근거가 됩니다.
          </li>
          <li>이메일이나 관리사무소 접수로 보내는 경우에도 보낸 날짜와 사본을 남겨 두세요.</li>
          <li>하자 부위 사진을 함께 첨부하고, 첨부 매수를 본문에 적어 두면 좋습니다.</li>
        </ul>
      </div>
    </div>
  );
}
