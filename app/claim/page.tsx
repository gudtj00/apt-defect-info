import Link from "next/link";

export const metadata = {
  title: "하자보수 청구 절차 — 하잡",
  description:
    "하자를 발견했다면 누구에게, 어떻게 청구하고, 시공사가 응하지 않으면 무엇을 할 수 있는지 공동주택관리법 규정에 따라 단계별로 정리했습니다.",
};

/** 법령 근거를 본문 옆에 작게 붙인다 — 어디서 나온 규정인지 추적 가능하게. */
function Cite({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-normal text-slate-400">({children})</span>;
}

function Step({
  no,
  title,
  cite,
  children,
}: {
  no: number;
  title: string;
  cite?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-11">
      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
        {no}
      </span>
      <h3 className="pt-1 text-base font-bold text-slate-900">
        {title} {cite ? <Cite>{cite}</Cite> : null}
      </h3>
      <div className="mt-2 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
    </li>
  );
}

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">하자보수 청구 절차</h1>
      <p className="mt-2 text-slate-600">
        하자를 발견했다면 어디서부터 시작해야 하는지, 시공사가 응하지 않으면 무엇을 할 수 있는지 순서대로
        정리했습니다. 아래 내용은 모두 공동주택관리법과 같은 법 시행령에 정해진 절차입니다.
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="text-sm leading-7 text-emerald-900">
          <strong className="font-bold">먼저 확인할 것 — 담보책임기간이 남아 있나요?</strong>
          <br />
          이 기간이 지나면 무상 보수 청구가 원칙적으로 어려워집니다. 우리 단지 기간이 얼마나 남았는지부터
          확인해 보세요.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-emerald-700"
        >
          우리 단지 기간 확인하기
        </Link>
      </div>

      <ol className="mt-8 space-y-8">
        <Step no={1} title="하자를 기록해 둡니다">
          <p>
            청구 이후에 하자 발생 시점이나 상태를 두고 다툼이 생기는 경우가 많습니다. 청구하기 전에 남겨두면
            좋은 것들입니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>하자 부위 사진 — 촬영 날짜가 확인되는 상태로</li>
            <li>발생한 위치 (동·호수, 어느 방·어느 벽면인지)</li>
            <li>처음 발견한 날짜</li>
            <li>관리사무소에 구두로 알린 적이 있다면 그 날짜와 담당자</li>
          </ul>
        </Step>

        <Step no={2} title="누가 청구하는지 확인합니다" cite="시행령 제38조제2항">
          <p>하자 위치가 내 집 안인지 공용 공간인지에 따라 청구하는 주체가 다릅니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">구분</th>
                  <th className="py-2 font-semibold">청구하는 사람</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4 align-top">
                    <strong className="font-semibold text-slate-900">전유부분</strong>
                    <br />
                    <span className="text-xs text-slate-400">내 집 안</span>
                  </td>
                  <td className="py-2 align-top">
                    입주자 본인이 직접 청구합니다. 원한다면 관리주체가 대신 청구하도록 요청할 수도 있습니다.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 align-top">
                    <strong className="font-semibold text-slate-900">공용부분</strong>
                    <br />
                    <span className="text-xs text-slate-400">복도·주차장·외벽 등</span>
                  </td>
                  <td className="py-2 align-top">
                    입주자대표회의, 관리주체, 관리단이 청구합니다. 개인이 직접 청구하는 것이 아니라 이들에게
                    청구해 달라고 요청하는 방식입니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Step>

        <Step no={3} title="사업주체(시공사)에 청구합니다" cite="시행령 제38조제1항">
          <p>
            청구는 <strong className="font-semibold text-slate-900">담보책임기간 안에</strong> 해야 합니다.
            법이 청구 방식을 특정하고 있지는 않지만, 다음 단계의 15일이 언제부터 시작됐는지 다투지 않으려면
            서면으로 남기고 보낸 기록을 보관하는 편이 안전합니다.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">청구서에 들어가면 좋은 내용</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>단지명·동·호수, 청구인 이름과 연락처</li>
              <li>하자 부위와 상태 (사진 첨부)</li>
              <li>하자를 발견한 날짜</li>
              <li>보수를 요청한다는 의사 표시</li>
              <li>회신받을 주소·연락처</li>
            </ul>
          </div>
        </Step>

        <Step no={4} title="15일 안에 시공사가 답해야 합니다" cite="시행령 제38조제3항·제4항">
          <p>
            사업주체는 청구받은 날부터{" "}
            <strong className="font-semibold text-slate-900">15일 이내</strong>에 하자를 보수하거나,
            하자보수계획을 서면으로 통보해야 합니다. 이 통보는 청구한 사람뿐 아니라{" "}
            <strong className="font-semibold text-slate-900">시장·군수·구청장에게도</strong> 함께 가야 합니다.
          </p>
          <p>하자보수계획에는 다음이 들어갑니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>하자 부위와 보수 방법</li>
            <li>
              보수에 걸리는 기간 — 자재·장비·인력 수급이 곤란한 경우 등 특별한 사유가 없으면{" "}
              <strong className="font-semibold text-slate-900">60일 이내</strong>여야 합니다
            </li>
            <li>담당자 성명과 연락처</li>
          </ul>
          <p>
            하자가 아니라고 판단한 경우에도 그냥 넘어갈 수 없고,{" "}
            <strong className="font-semibold text-slate-900">그 이유를 서면으로</strong> 통보해야 합니다. 보수가
            끝나면 그 결과도 통보하게 되어 있습니다.
          </p>
        </Step>

        <Step no={5} title="응답이 없거나 받아들여지지 않으면">
          <p>두 가지 경로가 있고, 둘 다 이용할 수 있습니다.</p>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-semibold text-slate-900">
                지자체에 시정명령을 요청 <Cite>법 제37조제5항</Cite>
              </p>
              <p className="mt-1">
                사업주체가 정당한 사유 없이 청구에 따르지 않을 때, 시장·군수·구청장이 시정을 명할 수 있습니다.
                4단계의 계획 통보가 지자체에도 가도록 되어 있어서, 통보 자체가 없었다는 사실이 확인되는
                경로이기도 합니다.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-semibold text-slate-900">
                하자심사·분쟁조정위원회에 신청 <Cite>법 제45조</Cite>
              </p>
              <p className="mt-1">
                국토교통부 소속 위원회가 하자 여부를 판정하거나 분쟁을 조정합니다. 신청을 받은 날부터{" "}
                <strong className="font-semibold text-slate-900">60일</strong>(공용부분은 90일) 이내에 절차를
                마치도록 되어 있고, 한 차례 30일까지 연장될 수 있습니다. 감정이 필요한 기간은 이 기간에서
                제외되며, 신청에는 수수료가 듭니다.
              </p>
              <p className="mt-1">
                판정 결과에 이의가 있으면 판정서를 받은 날부터 30일 이내에 전문기관 의견서를 붙여 이의신청을 할
                수 있습니다 <Cite>법 제43조제4항</Cite>.
              </p>
              <a
                href="https://www.adc.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-emerald-600 no-underline hover:underline"
              >
                하자심사·분쟁조정위원회 (adc.go.kr) →
              </a>
            </div>
          </div>
        </Step>
      </ol>

      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <h2 className="text-base font-bold text-amber-900">구조안전에 중대한 하자가 의심된다면</h2>
        <p className="mt-2 text-sm leading-7 text-amber-900">
          철근·기둥·내력벽처럼 건물을 지탱하는 부분의 하자는 위 절차와 별개의 경로가 있습니다. 시장·군수·구청장은
          담보책임기간에 공동주택의 구조안전에 중대한 하자가 있다고 인정하면 안전진단기관에 의뢰해 안전진단을 할
          수 있습니다 <Cite>법 제37조제4항</Cite>. 구조와 관련된 사항이라고 판단되면 관리사무소·입주자대표회의와
          함께 관할 지자체에 알리는 것이 개인이 개별 청구를 진행하는 것보다 빠른 경우가 있습니다.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">기간별로 정리하면</h2>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
          <li>
            <strong className="font-semibold text-slate-900">청구</strong> — 담보책임기간 안에
          </li>
          <li>
            <strong className="font-semibold text-slate-900">15일</strong> — 시공사의 보수 또는 계획 통보 기한
          </li>
          <li>
            <strong className="font-semibold text-slate-900">60일</strong> — 계획상 보수 기간의 원칙적 상한
          </li>
          <li>
            <strong className="font-semibold text-slate-900">60일 / 90일</strong> — 분쟁조정 처리기간
            (전유/공용)
          </li>
          <li>
            <strong className="font-semibold text-slate-900">30일</strong> — 판정 결과에 대한 이의신청 기한
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/defect"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
        >
          내 증상이 어떤 하자인지 찾아보기
        </Link>
        <Link
          href="/faq"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
        >
          자주 묻는 질문
        </Link>
      </div>

      <p className="mt-6 text-xs leading-6 text-slate-400">
        이 페이지는 공동주택관리법과 같은 법 시행령에 정해진 절차를 정리한 참고 자료이며 법률 자문이 아닙니다.
        개별 사안에 따라 적용이 달라질 수 있고, 하자 여부 판정은 하자심사·분쟁조정위원회 또는 전문가 확인이
        필요합니다.
      </p>
    </div>
  );
}
