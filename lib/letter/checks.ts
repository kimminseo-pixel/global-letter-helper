// Design Ref: §5 서버 후검사 — 분량 기준과 줄임말 검사 (순수 함수, 서버·테스트 어디서나 사용)
// Plan SC: 분량은 A4 한 장 이내, 구어체·줄임말 없음 — 어긋나면 응답의 warnings에 담는다.
import type { LetterRequest } from "./schema";

type Language = LetterRequest["language"];

/** 언어별 분량 상한 (DESIGN §5). 중·일 수치는 PRD에 없는 값이라 확인이 필요하다. */
export const LENGTH_LIMITS: Record<
  Language,
  { unit: "단어" | "자"; max: number; label: string }
> = {
  en: { unit: "단어", max: 300, label: "영어" },
  zh: { unit: "자", max: 500, label: "중국어" },
  ja: { unit: "자", max: 600, label: "일본어" },
};

/** 영어는 단어 수, 중국어·일본어는 공백을 뺀 글자 수를 센다. */
export function measureLength(language: Language, text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  if (language === "en") return trimmed.split(/\s+/).length;
  return trimmed.replace(/\s/g, "").length;
}

// don't, I'm, we're, they've, we'll 같은 줄임말. 소유격('s)은 오탐이 많아 검사하지 않는다.
const CONTRACTION = /\b[A-Za-z]+(?:n['’]t|['’](?:m|re|ve|ll))\b/g;

/** 초안이 분량·줄임말 기준을 어기면 사용자에게 보여 줄 경고 문구를 돌려준다. */
export function findDraftWarnings(language: Language, draft: string): string[] {
  const warnings: string[] = [];

  const { unit, max, label } = LENGTH_LIMITS[language];
  const length = measureLength(language, draft);
  if (length > max) {
    warnings.push(
      `초안이 A4 한 장 기준(${label} 약 ${max}${unit})을 넘습니다. 현재 ${length}${unit}입니다. 줄이는 것을 권장합니다.`,
    );
  }

  // 초안은 선택한 언어의 문자로만 써야 한다. 한국어 이름·기관명이 그대로 남은 경우를 알린다.
  const hangul = Array.from(new Set(draft.match(/[가-힣]+/g) ?? []));
  if (hangul.length > 0) {
    warnings.push(
      "이름, 호텔 이름 등 고유명사는 한 번 더 확인해 주세요.",
    );
  }

  if (language === "en") {
    const found = Array.from(new Set(draft.match(CONTRACTION) ?? []));
    if (found.length > 0) {
      warnings.push(
        `영어 초안에 줄임말이 남아 있습니다: ${found.join(", ")}. 공문에서는 풀어 쓰는 것이 좋습니다.`,
      );
    }
  }

  return warnings;
}
