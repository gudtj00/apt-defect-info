import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getAllDefectSlugs,
  getNamedPageDoc,
  getDefectByCode,
  getArticleText,
  getProcedureArticleTexts,
  getWarrantyCategory,
  getNamedSlugForCode,
  resolveArticleLink,
  NAMED_PAGES,
  phenomena,
  PHENOMENON_SLUG,
  type ProcedureArticle,
} from "@/lib/defects";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllDefectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isNamedSlug(slug)) {
    const doc = getNamedPageDoc(slug);
    const name = String(doc?.frontmatter.name ?? slug);
    return { title: `${name} 하자 — 하자 유형 검색`, description: `${name} 관련 하자판정기준 고시 조문과 담보책임기간 정리.` };
  }
  const type = getDefectByCode(slug);
  if (!type) return {};
  return {
    title: `${type.judgmentArticle}(${type.name}) — 하자 유형 검색`,
    description: type.plainExplanation ?? `${type.judgmentArticle}(${type.name}) 판정 기준 원문과 담보책임기간.`,
  };
}

const isNamedSlug = (slug: string) => NAMED_PAGES.some((p) => p.slug === slug);

function ArticleLinkList({ articles }: { articles: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {articles.map((a) => {
        const link = resolveArticleLink(a);
        if (!link) return null;
        return (
          <li key={a}>
            <Link
              href={`/defect/${link.slug}`}
              className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 no-underline hover:border-emerald-300 hover:text-emerald-600"
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 이 현상이 6개 현상 중 어디쯤인지 보여주는 가로 막대 인포그래픽. */
function FrequencyChart({ currentSlug }: { currentSlug: string }) {
  const maxShare = Math.max(...phenomena.ranking.map((r) => r.share));
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold text-slate-500">전체 하자 유형 6개 중 발생 빈도</p>
      <div className="flex flex-col gap-2">
        {phenomena.ranking.map((r) => {
          const isCurrent = PHENOMENON_SLUG[r.name] === currentSlug;
          const widthPct = (r.share / maxShare) * 100;
          return (
            <div key={r.name} className="flex items-center gap-2 text-xs">
              <span className={"w-24 shrink-0 " + (isCurrent ? "font-bold text-emerald-700" : "text-slate-500")}>
                {r.rank}위 · {r.name}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={"h-full rounded-full " + (isCurrent ? "bg-emerald-600" : "bg-slate-300")}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className={"w-11 shrink-0 text-right " + (isCurrent ? "font-bold text-emerald-700" : "text-slate-400")}>
                {(r.share * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[0.7rem] text-slate-400">
        하자심사·분쟁조정위원회 통계(2021년~2026년 2월 누적 {phenomena.note.match(/([\d,]+)건 접수/)?.[1] ?? ""}건 접수 기준)
      </p>
    </div>
  );
}

function NamedPage({ slug }: { slug: string }) {
  const doc = getNamedPageDoc(slug);
  if (!doc) notFound();
  const fm = doc.frontmatter;
  const name = String(fm.name ?? slug);
  const relatedArticles = Array.isArray(fm.relatedArticles) ? (fm.relatedArticles as string[]) : null;
  const sourceUrl = typeof fm.sourceUrl === "string" ? fm.sourceUrl : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <p className="mb-2">
        <Link href="/defect" className="text-sm text-slate-500 no-underline hover:text-emerald-600">
          ← 하자 유형 검색으로
        </Link>
      </p>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{name}</h1>

      {relatedArticles && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-slate-600">
            이 현상은 아래 {relatedArticles.length}개 조문에 걸쳐 공통으로 나타나요. 조문별 자세한 내용은 아래
            링크에서 확인해보세요.
          </p>
          <ArticleLinkList articles={relatedArticles} />
        </div>
      )}

      <FrequencyChart currentSlug={slug} />

      <article className="defect-markdown mt-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </article>

      {sourceUrl && (
        <p className="mt-6 text-xs text-slate-400">
          원문 출처:{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400">
            국가법령정보센터
          </a>
        </p>
      )}
    </div>
  );
}

function StepHeading({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {n}
      </span>
      {children}
    </h2>
  );
}

function LawQuote({ text }: { text: string }) {
  return (
    <blockquote className="whitespace-pre-wrap rounded-r-lg border-l-[3px] border-emerald-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
      {text}
    </blockquote>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-lg border-l-[3px] border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      📌 {children}
    </p>
  );
}

function ProcedureBlock({
  label,
  articles,
  note,
}: {
  label: string;
  articles: ProcedureArticle[];
  note?: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      {articles.length > 0 ? (
        <div className="flex flex-col gap-2">
          {articles.map((a) => (
            <LawQuote key={a.number} text={a.text} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-700">확인 필요</p>
      )}
      {note && <Callout>{note}</Callout>}
    </div>
  );
}

function ArticleReferencePage({ code }: { code: string }) {
  const namedSlug = getNamedSlugForCode(code);
  if (namedSlug) redirect(`/defect/${namedSlug}`);
  const type = getDefectByCode(code);
  if (!type) notFound();
  const articleText = getArticleText(code);
  const warranty = getWarrantyCategory(type.warrantyCategoryCode);
  const investigationArticles = getProcedureArticleTexts(type.investigationArticle);
  const repairCostArticles = getProcedureArticleTexts(type.repairCostArticle);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <p className="mb-2">
        <Link href="/defect/articles" className="text-sm text-slate-500 no-underline hover:text-emerald-600">
          ← 전체 조문 목록으로
        </Link>
      </p>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        {type.judgmentArticle}({type.name})
      </h1>

      {type.plainExplanation ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-[0.95rem] leading-7 text-slate-800">
          {type.plainExplanation}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          하자판정기준 고시 조문 원문 그대로이며, 아직 쉬운 말 풀이는 준비되지 않았습니다.
        </p>
      )}

      <StepHeading n={1}>이럴 때 하자로 봅니다</StepHeading>
      {articleText ? (
        <LawQuote text={articleText} />
      ) : (
        <p className="text-sm text-slate-400">원문을 확보하지 못했습니다 — 확인 필요.</p>
      )}

      <StepHeading n={2}>이렇게 확인하고 보수비용을 계산해요</StepHeading>
      <ProcedureBlock label="조사방법" articles={investigationArticles} note={type.investigationNote} />
      <ProcedureBlock label="보수비용 산정" articles={repairCostArticles} note={type.repairCostNote} />

      <StepHeading n={3}>담보책임기간</StepHeading>
      {warranty ? (
        <p className="text-sm text-slate-800">
          <strong className="text-base">
            {warranty.name} · {warranty.years}년
          </strong>
          {type.warrantyCategoryNote && (
            <span className="mt-1 block text-sm text-slate-500">{type.warrantyCategoryNote}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-slate-400">해당하는 시설공사 분류가 없습니다.</p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        정확한 우리 아파트의 잔여 기간은 단지별 담보책임기간 계산기에서 확인하세요.
      </p>

      {type.phenomenonTags.length > 0 && (
        <>
          <StepHeading n={4}>관련 현상</StepHeading>
          <p className="text-sm text-slate-600">
            이 조문은 다음 현상 분류와도 관련돼요: {type.phenomenonTags.join(", ")}
          </p>
        </>
      )}

      <p className="mt-8 text-xs text-slate-400">
        이 페이지가 제공하는 정보는 참고용이며 법률 자문이 아닙니다. 실제 하자 여부 판정은 하자심사·분쟁조정위원회
        또는 전문가 확인이 필요합니다.
      </p>
    </div>
  );
}

export default async function DefectSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isNamedSlug(slug)) return <NamedPage slug={slug} />;
  return <ArticleReferencePage code={slug} />;
}
