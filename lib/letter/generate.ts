// Design Ref: §2.1 (5)~(8), §4.2, §5 — OpenAI 호출·응답 검증 (서버 전용)
// Plan SC: API 키는 서버에서만 읽고, 모델명은 OPENAI_MODEL로 분리하며, AI 쪽 저장 옵션을 끈다.
import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import * as z from "zod";

import { findDraftWarnings } from "./checks";
import { buildLetterPrompt } from "./prompt";
import {
  aiLetterSchema,
  type ErrorCode,
  type LetterRequest,
  type LetterResponse,
} from "./schema";

/** AI 한 번 호출의 제한 시간 (DESIGN §4.2: 45초) */
const AI_CALL_TIMEOUT_MS = 45_000;
/** 라우트 maxDuration(60초) 안에서 여유를 두고 쓸 수 있는 전체 시간 */
const TOTAL_BUDGET_MS = 55_000;
/** 재시도를 시작하려면 남아 있어야 하는 최소 시간 */
const MIN_RETRY_MS = 5_000;

/** 화면에 보여 줄 오류 코드를 담은 오류 (내용 없이 코드만 전달한다) */
export class LetterError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
    this.name = "LetterError";
  }
}

// OpenAI 구조화 출력은 글자 수·개수 제약을 지원하지 않을 수 있어,
// AI에는 제약 없는 형태를 요구하고 받은 뒤 aiLetterSchema로 다시 검증한다.
// Plan SC: 구조(수신 → 제목 → 본문 → 발신) 고정 — 초안을 한 덩어리로 받지 않고 네 부분으로 받아
// 서버가 고정된 순서로 이어 붙인다. 어느 언어에서도 순서가 바뀌거나 빠지지 않는다.
const aiWireSchema = z.object({
  recipientBlock: z.string(),
  subject: z.string(),
  body: z.string(),
  senderBlock: z.string(),
  koreanVersion: z.string(),
  reviewPoints: z.array(z.string()),
  uncertain: z.array(z.object({ phrase: z.string(), reason: z.string() })),
  missingItems: z.array(
    z.object({ label: z.string(), suggestion: z.string() }),
  ),
});

function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[letters] OPENAI_API_KEY가 설정되지 않았습니다.");
    throw new LetterError("INTERNAL");
  }
  return new OpenAI({ apiKey, maxRetries: 0 });
}

/** OPENAI_MODEL이 없을 때 쓰는 기본 모델 (이 키로 사용 가능함을 확인한 모델) */
const DEFAULT_MODEL = "gpt-4.1-mini";

function readModel(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

/** OpenAI 오류를 화면용 오류 코드로 바꾼다. 요청·응답 내용은 로그에 남기지 않는다. */
function toLetterError(error: unknown): LetterError {
  if (error instanceof LetterError) return error;
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new LetterError("AI_TIMEOUT");
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new LetterError("RATE_LIMITED");
  }
  if (error instanceof OpenAI.APIError) {
    console.error("[letters] OpenAI 오류", error.status ?? "-", error.name);
    return new LetterError("AI_ERROR");
  }
  console.error("[letters] 예상하지 못한 오류", error instanceof Error ? error.name : "-");
  return new LetterError("INTERNAL");
}

/**
 * 공문 초안을 만든다.
 * - 저장 옵션을 꺼서 OpenAI 쪽에 입력·결과가 남지 않게 한다 (DESIGN §5).
 * - 형식이 맞지 않을 때만 남은 시간 안에서 1회 재시도하고, 시간 초과에는 재시도하지 않는다.
 */
export async function generateLetter(
  request: LetterRequest,
): Promise<LetterResponse> {
  const client = createClient();
  const model = readModel();
  const prompt = buildLetterPrompt(request);
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (attempt > 1 && remaining < MIN_RETRY_MS) break;

    try {
      const response = await client.responses.parse(
        {
          model,
          store: false,
          input: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          text: { format: zodTextFormat(aiWireSchema, "official_letter") },
        },
        { timeout: Math.min(AI_CALL_TIMEOUT_MS, remaining) },
      );

      const parts = response.output_parsed;
      // 수신 부분에 인사말(Dear …)이 섞여 들어오면 본문 인사말과 겹치므로 그 줄만 뺀다.
      if (parts !== null && /^\s*Dear\b/i.test(parts.body)) {
        parts.recipientBlock = parts.recipientBlock
          .split("\n")
          .filter((line) => !/^\s*Dear\b/i.test(line))
          .join("\n");
      }
      // 제목·본문은 반드시 있어야 한다. 수신·발신 정보는 사용자가 입력하지 않으면 비어 올 수 있고,
      // 입력하지 않은 칸은 쓰지 않기로 했으므로(빈 대괄호를 남기지 않음) 빈 부분은 건너뛴다.
      const complete =
        parts !== null &&
        parts.subject.trim() !== "" &&
        parts.body.trim() !== "";
      const checked = aiLetterSchema.safeParse(
        complete
          ? {
              draft: [
                parts.recipientBlock,
                parts.subject,
                parts.body,
                parts.senderBlock,
              ]
                .map((part) => part.trim())
                .filter((part) => part !== "")
                .join("\n\n"),
              koreanVersion: parts.koreanVersion,
              reviewPoints: parts.reviewPoints,
              uncertain: parts.uncertain,
              missingItems: parts.missingItems,
            }
          : null,
      );
      if (checked.success) {
        // Plan SC: 분량·줄임말 기준을 어기면 거절하지 않고 경고로 알린다 (DESIGN §5).
        const warnings = findDraftWarnings(request.language, checked.data.draft);
        return { ...checked.data, warnings };
      }
      // 형식 불일치: 다음 반복에서 1회 재시도
    } catch (error) {
      throw toLetterError(error);
    }
  }

  throw new LetterError("AI_ERROR");
}
