// 축① 슬러그 개선. kaptCode 그대로 쓰던 것(`/apt/a10025009`)을
// 지역+단지명 로마자 표기 기반으로 바꾼다 — 다만 로마자 변환이 100% 정확하다고
// 보증할 수 없으므로(공식 로마자 표기와 다를 수 있음), 뒤에 kaptCode를 그대로 붙여서
// 어떤 경우에도 충돌 없이 유일함을 보장한다. "예쁘지만 불확실한 변환"과
// "확실히 유일한 코드"를 둘 다 살리는 절충.
import aromanize from "aromanize";

function slugifyPart(text: string): string {
  const romanized = aromanize.romanize(text);
  return romanized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildAptSlug(region: string | null | undefined, name: string, kaptCode: string): string {
  const parts = [region, name]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map(slugifyPart)
    .filter((s) => s.length > 0);
  return [...parts, kaptCode.toLowerCase()].join("-");
}
