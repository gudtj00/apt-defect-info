import Link from "next/link";
import { ArrowSquareOutIcon, ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import ClaimLetter from "./ClaimLetter";
import { Badge, Hero, PrimaryLink, FootNote } from "../_components/ui";

export const metadata = {
  title: "하자보수 청구 절차와 청구서 양식 | 하잡",
  description:
    "하자를 발견했다면 누구에게, 어떻게 청구하고, 시공사가 응하지 않으면 무엇을 할 수 있는지 공동주택관리법 규정에 따라 단계별로 정리했습니다. 값만 채우면 완성되는 하자보수 청구서 양식도 함께 제공합니다.",
};

/** 법령 근거를 본문 옆에 작게 붙인다. 어디서 나온 규정인지 추적 가능하게. */
function Cite({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-normal text-ink-3">({children})</span>;
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
      <span className="tnum absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
        {no}
      </span>
      <h3 className="pt-1 text-base font-bold text-ink">
        {title} {cite ? <Cite>{cite}</Cite> : null}
      </h3>
      <div className="mt-2 space-y-3 text-sm leading-7 text-ink-2">{children}</div>
    </li>
  );
}

/** 절차 전체에서 지켜야 하는 기한. 본문에 흩어져 있는 숫자를 한 번 더 모아준다. */
const DEADLINES = [
  { term: "청구", detail: "담보책임기간 안에" },
  { term: "15일", detail: "시공사의 보수 또는 계획 통보 기한" },
  { term: "60일", detail: "계획상 보수 기간의 원칙적 상한" },
  { term: "60일 / 90일", detail: "분쟁조정 처리기간 (전유 / 공용)" },
  { term: "30일", detail: "판정 결과에 대한 이의신청 기한" },
];

export default function ClaimPage() {
  return (
    <div>
      <Hero
        badge={<Badge>공동주택관리법 제37조 · 시행령 제38조</Badge>}
        title="하자를 발견했다면"
        accent="이 순서로 청구하세요"
        description="누구에게 어떻게 청구하는지, 시공사는 언제까지 답해야 하는지, 응하지 않으면 무엇을 할 수 있는지 정리했습니다."
      />

      <div className="mx-auto max-w-6xl px-5 py-12">
        {/* 절차를 밟기 전에 먼저 확인해야 하는 것이라 두 단 위에 가로로 둔다. */}
        <div className="rounded-2xl border border-accent-line bg-accent-soft px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="text-sm leading-7 text-accent-soft-ink">
            <strong className="font-bold">먼저 확인할 것: 담보책임기간이 남아 있나요?</strong>
            <br />이 기간이 지나면 무상 보수 청구가 원칙적으로 어려워집니다. 우리 단지 기간이 얼마나 남았는지부터
            확인해 보세요.
          </p>
          <div className="mt-4 shrink-0 sm:mt-0">
            <PrimaryLink href="/calculator">우리 단지 기간 확인하기</PrimaryLink>
          </div>
        </div>

        {/*
          왼쪽은 "무엇을 어떤 순서로 하는가", 오른쪽은 "그래서 지금 쓴다".
          읽는 축과 쓰는 축이 달라서 세로로 이어 놓으면 3단계에서 문서를 쓰다가
          4단계 기한을 다시 찾아 올라가야 했다.

          단 배치는 명시적으로 지정한다. 그래야 좁은 화면에서 문서(오른쪽)가
          5단계 바로 뒤에 오고, 보조 설명(구조안전)이 그 뒤로 밀린다.
          자동 배치에 맡기면 순서가 뒤집힌다.
        */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14">
          <section className="lg:col-start-1 lg:row-start-1">
            <h2 className="text-xl font-bold tracking-tight text-ink">청구 절차</h2>
            <p className="mt-1.5 text-sm leading-7 text-ink-2">
              공동주택관리법과 같은 법 시행령이 정한 순서입니다.
            </p>

            <ol className="mt-8 space-y-8">
              <Step no={1} title="하자를 기록해 둡니다">
                <p>
                  청구 이후에 하자 발생 시점이나 상태를 두고 다툼이 생기는 경우가 많습니다. 청구하기 전에 남겨두면
                  좋은 것들입니다.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>하자 부위 사진 (촬영 날짜가 확인되는 상태로)</li>
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
                      <tr className="border-b border-line text-ink-2">
                        <th className="py-2 pr-4 font-semibold">구분</th>
                        <th className="py-2 font-semibold">청구하는 사람</th>
                      </tr>
                    </thead>
                    <tbody className="text-ink-2">
                      <tr className="border-b border-line-soft">
                        <td className="py-3 pr-4 align-top">
                          <strong className="font-semibold text-ink">전유부분</strong>
                          <br />
                          <span className="text-xs text-ink-3">내 집 안</span>
                        </td>
                        <td className="py-3 align-top">
                          입주자 본인이 직접 청구합니다. 원한다면 관리주체가 대신 청구하도록 요청할 수도 있습니다.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 align-top">
                          <strong className="font-semibold text-ink">공용부분</strong>
                          <br />
                          <span className="text-xs text-ink-3">복도·주차장·외벽 등</span>
                        </td>
                        <td className="py-3 align-top">
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
                  청구는 <strong className="font-semibold text-ink">담보책임기간 안에</strong> 해야 합니다. 법이
                  청구 방식을 특정하고 있지는 않지만, 다음 단계의 15일이 언제부터 시작됐는지 다투지 않으려면
                  서면으로 남기고 보낸 기록을 보관하는 편이 안전합니다.
                </p>
                {/* 청구서는 옆단(좁은 화면에서는 아래)에 있다. "오른쪽"이라고 쓰면
                    화면 폭에 따라 틀린 말이 되므로 방향 대신 링크로 보낸다. */}
                <p className="rounded-2xl border border-line bg-inset px-4 py-3">
                  <a
                    href="#claim-letter"
                    className="inline-flex items-center gap-1.5 font-semibold text-accent no-underline hover:underline"
                  >
                    <ArrowDownIcon size={14} weight="bold" aria-hidden="true" className="lg:hidden" />
                    청구서 양식 바로 만들기
                  </a>
                  <span className="mt-1 block text-ink-2">
                    값만 채우면 이 조문을 인용한 청구서가 완성됩니다.
                  </span>
                </p>
              </Step>

              <Step no={4} title="15일 안에 시공사가 답해야 합니다" cite="시행령 제38조제3항·제4항">
                <p>
                  사업주체는 청구받은 날부터 <strong className="font-semibold text-ink">15일 이내</strong>에 하자를
                  보수하거나, 하자보수계획을 서면으로 통보해야 합니다. 이 통보는 청구한 사람뿐 아니라{" "}
                  <strong className="font-semibold text-ink">시장·군수·구청장에게도</strong> 함께 가야 합니다.
                </p>
                <p>하자보수계획에는 다음이 들어갑니다.</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>하자 부위와 보수 방법</li>
                  <li>
                    보수에 걸리는 기간. 자재·장비·인력 수급이 곤란한 경우 등 특별한 사유가 없으면{" "}
                    <strong className="font-semibold text-ink">60일 이내</strong>여야 합니다
                  </li>
                  <li>담당자 성명과 연락처</li>
                </ul>
                <p>
                  하자가 아니라고 판단한 경우에도 그냥 넘어갈 수 없고,{" "}
                  <strong className="font-semibold text-ink">그 이유를 서면으로</strong> 통보해야 합니다. 보수가
                  끝나면 그 결과도 통보하게 되어 있습니다.
                </p>
              </Step>

              <Step no={5} title="응답이 없거나 받아들여지지 않으면">
                <p>두 가지 경로가 있고, 둘 다 이용할 수 있습니다.</p>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                    <p className="font-semibold text-ink">
                      지자체에 시정명령을 요청 <Cite>법 제37조제5항</Cite>
                    </p>
                    <p className="mt-1">
                      사업주체가 정당한 사유 없이 청구에 따르지 않을 때, 시장·군수·구청장이 시정을 명할 수
                      있습니다. 4단계의 계획 통보가 지자체에도 가도록 되어 있어서, 통보 자체가 없었다는 사실이
                      확인되는 경로이기도 합니다.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                    <p className="font-semibold text-ink">
                      하자심사·분쟁조정위원회에 신청 <Cite>법 제45조</Cite>
                    </p>
                    <p className="mt-1">
                      국토교통부 소속 위원회가 하자 여부를 판정하거나 분쟁을 조정합니다. 신청을 받은 날부터{" "}
                      <strong className="font-semibold text-ink">60일</strong>(공용부분은 90일) 이내에 절차를
                      마치도록 되어 있고, 한 차례 30일까지 연장될 수 있습니다. 감정이 필요한 기간은 이 기간에서
                      제외되며, 신청에는 수수료가 듭니다.
                    </p>
                    <p className="mt-1">
                      판정 결과에 이의가 있으면 판정서를 받은 날부터 30일 이내에 전문기관 의견서를 붙여 이의신청을
                      할 수 있습니다 <Cite>법 제43조제4항</Cite>.
                    </p>
                    <a
                      href="https://www.adc.go.kr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-accent no-underline hover:underline"
                    >
                      {/* 좁은 화면에서 줄이 바뀌면 아이콘만 다음 줄에 떨어진다. 주소와 묶어 둔다. */}
                      하자심사·분쟁조정위원회{" "}
                      <span className="whitespace-nowrap">
                        (adc.go.kr)
                        <ArrowSquareOutIcon
                          size={14}
                          weight="bold"
                          aria-hidden="true"
                          className="ml-1 inline align-[-2px]"
                        />
                      </span>
                    </a>
                  </div>
                </div>
              </Step>
            </ol>
          </section>

          {/* 오른쪽 단: 쓰는 쪽 */}
          <section
            id="claim-letter"
            className="scroll-mt-24 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          >
            <h2 className="text-xl font-bold tracking-tight text-ink">청구서 만들기</h2>
            <p className="mt-1.5 text-sm leading-7 text-ink-2">
              3단계에서 보낼 문서입니다. 왼쪽 절차를 보면서 채우세요.
            </p>

            <div className="mt-8">
              <ClaimLetter />
            </div>

            {/* 문서를 쓰는 동안 옆에 두면 좋은 숫자들이라 이쪽 단에 붙인다. */}
            <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4">
              <h3 className="text-base font-bold text-ink">기간별로 정리하면</h3>
              <dl className="mt-3 divide-y divide-line-soft">
                {DEADLINES.map((d) => (
                  <div
                    key={d.term}
                    className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <dt className="tnum shrink-0 font-semibold text-ink sm:w-28">{d.term}</dt>
                    <dd className="text-sm leading-7 text-ink-2">{d.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* 절차의 예외 경로. 좁은 화면에서는 청구서 다음에 오도록 마지막에 둔다. */}
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="rounded-2xl border border-warn-line bg-warn px-5 py-4">
              <h2 className="text-base font-bold text-warn-ink">구조안전에 중대한 하자가 의심된다면</h2>
              <p className="mt-2 text-sm leading-7 text-warn-ink">
                철근·기둥·내력벽처럼 건물을 지탱하는 부분의 하자는 위 절차와 별개의 경로가 있습니다.
                시장·군수·구청장은 담보책임기간에 공동주택의 구조안전에 중대한 하자가 있다고 인정하면
                안전진단기관에 의뢰해 안전진단을 할 수 있습니다 <Cite>법 제37조제4항</Cite>. 구조와 관련된
                사항이라고 판단되면 관리사무소·입주자대표회의와 함께 관할 지자체에 알리는 것이 개인이 개별 청구를
                진행하는 것보다 빠른 경우가 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/defect"
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink no-underline transition hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink active:translate-y-px"
            >
              내 증상이 어떤 하자인지 찾아보기
            </Link>
            <Link
              href="/faq"
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink no-underline transition hover:border-accent-line hover:bg-accent-soft hover:text-accent-soft-ink active:translate-y-px"
            >
              자주 묻는 질문
            </Link>
          </div>

          <div className="mt-6">
            <FootNote>
              이 페이지는 공동주택관리법과 같은 법 시행령에 정해진 절차를 정리한 참고 자료이며 법률 자문이
              아닙니다. 개별 사안에 따라 적용이 달라질 수 있고, 하자 여부 판정은 하자심사·분쟁조정위원회 또는
              전문가 확인이 필요합니다.
            </FootNote>
          </div>
        </div>
      </div>
    </div>
  );
}
