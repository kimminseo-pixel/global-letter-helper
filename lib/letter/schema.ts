// Design Ref: §2.2 요청 데이터, §2.3 응답 데이터, §4.2 오류 응답 — 화면과 서버가 함께 쓰는 공통 타입과 검증 스키마
// Plan SC: 입력에 없는 값은 지어내지 않음(빈 값 허용), 필수 입력은 수신처 유형·목적뿐
import * as z from "zod";

/** 필드별 최대 글자 수 (DESIGN §2.2) */
export const LIMITS = {
  country: 50,
  recipientOrg: 100,
  recipientName: 100,
  recipientTitle: 100,
  senderOrg: 100,
  senderName: 100,
  purpose: 200,
  content: 2000,
} as const;

/** 선택 항목: 코드 값, 화면 라벨 (DESIGN §2.2) */
export const RECIPIENT_TYPES = [
  { value: "government", label: "정부기관" },
  { value: "company", label: "기업" },
  { value: "other", label: "기타" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "영어" },
  { value: "zh", label: "중국어" },
  { value: "ja", label: "일본어" },
] as const;

export const LETTER_TYPES = [
  { value: "request", label: "협조 요청" },
  { value: "reply", label: "회신" },
  { value: "thanks", label: "감사" },
] as const;

export const FORMALITIES = [
  { value: "general", label: "일반 업무" },
  { value: "formal", label: "공식" },
  { value: "highest", label: "최고 격식" },
] as const;

/** 선택 칸의 기본값 (DESIGN §2.2) */
export const DEFAULT_LANGUAGE = "en";
export const DEFAULT_LETTER_TYPE = "request";
export const DEFAULT_FORMALITY = "formal";

const values = <T extends readonly { value: string }[]>(items: T) =>
  items.map((item) => item.value) as [T[number]["value"], ...T[number]["value"][]];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max}자 이하로 입력해 주세요`)
    .default("");

/** 공문 생성 요청 (브라우저 → 서버). 필수는 수신처 유형·목적뿐이다. */
export const letterRequestSchema = z.object({
  recipientType: z.enum(values(RECIPIENT_TYPES), {
    error: "수신처 유형을 선택해 주세요",
  }),
  country: optionalText(LIMITS.country),
  recipientOrg: optionalText(LIMITS.recipientOrg),
  recipientName: optionalText(LIMITS.recipientName),
  recipientTitle: optionalText(LIMITS.recipientTitle),
  senderOrg: optionalText(LIMITS.senderOrg),
  senderName: optionalText(LIMITS.senderName),
  purpose: z
    .string()
    .trim()
    .min(1, "목적을 입력해 주세요")
    .max(LIMITS.purpose, `${LIMITS.purpose}자 이하로 입력해 주세요`),
  content: optionalText(LIMITS.content),
  language: z.enum(values(LANGUAGES)).default(DEFAULT_LANGUAGE),
  letterType: z.enum(values(LETTER_TYPES)).default(DEFAULT_LETTER_TYPE),
  formality: z.enum(values(FORMALITIES)).default(DEFAULT_FORMALITY),
});

/** 화면이 보내는 값 (기본값 적용 전) */
export type LetterRequestInput = z.input<typeof letterRequestSchema>;
/** 서버가 검증한 뒤 쓰는 값 (기본값 적용 후) */
export type LetterRequest = z.output<typeof letterRequestSchema>;

/** AI에게 받는 5개 필드 (DESIGN §2.3). 호칭·격식 이유는 최대 3개. */
export const aiLetterSchema = z.object({
  draft: z.string().min(1),
  koreanVersion: z.string().min(1),
  reviewPoints: z.array(z.string()).max(3),
  uncertain: z.array(z.object({ phrase: z.string(), reason: z.string() })),
  missingItems: z.array(
    z.object({ label: z.string(), suggestion: z.string() }),
  ),
});

/** 서버가 브라우저에 돌려주는 결과: AI 5개 필드 + 서버가 채우는 경고 */
export const letterResponseSchema = aiLetterSchema.extend({
  warnings: z.array(z.string()),
});

export type AiLetter = z.infer<typeof aiLetterSchema>;
export type LetterResponse = z.infer<typeof letterResponseSchema>;

/** 오류 코드와 HTTP 상태, 화면 문구 (DESIGN §4.2) */
export const ERROR_CODES = {
  INVALID_INPUT: { status: 400, message: "입력한 내용을 확인해 주세요" },
  UNAUTHORIZED: {
    status: 401,
    message: "로그인이 만료되었습니다. 다시 로그인해 주세요",
  },
  RATE_LIMITED: {
    status: 429,
    message: "요청이 많습니다. 잠시 후 다시 시도해 주세요",
  },
  AI_TIMEOUT: {
    status: 504,
    message: "초안 생성이 지연되고 있습니다. 다시 시도해 주세요",
  },
  AI_ERROR: {
    status: 502,
    message: "초안을 만들지 못했습니다. 다시 시도해 주세요",
  },
  INTERNAL: { status: 500, message: "일시적인 오류입니다. 다시 시도해 주세요" },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/** 오류 응답 형식: { error: { code, message } } */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(
      Object.keys(ERROR_CODES) as [ErrorCode, ...ErrorCode[]],
    ),
    message: z.string(),
    /** 입력 검증 실패 시 필드별 안내 (DESIGN §4.2 "필드별 안내") */
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** 코드로 오류 응답 본문을 만든다 (내부 오류 내용은 담지 않는다). */
export function toErrorResponse(
  code: ErrorCode,
  fieldErrors?: Record<string, string[]>,
): ErrorResponse {
  return {
    error: { code, message: ERROR_CODES[code].message, fieldErrors },
  };
}
