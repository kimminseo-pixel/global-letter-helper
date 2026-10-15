// Design Ref: §4.1 POST /api/letters, §4.2 오류 응답 — 공문 생성 API
// 로그인 검사(401)는 PLAN 작업 14에서 이 파일에 추가한다.
import { LetterError, generateLetter } from "@/lib/letter/generate";
import {
  ERROR_CODES,
  letterRequestSchema,
  toErrorResponse,
  type ErrorCode,
} from "@/lib/letter/schema";

/** 서버 함수 제한 시간(초). AI 호출 45초 + 재시도 여유 (DESIGN §4.2) */
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(
  code: ErrorCode,
  fieldErrors?: Record<string, string[]>,
): Response {
  return Response.json(toErrorResponse(code, fieldErrors), {
    status: ERROR_CODES[code].status,
    headers: NO_STORE,
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT");
  }

  const parsed = letterRequestSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return errorResponse(
      "INVALID_INPUT",
      fieldErrors as Record<string, string[]>,
    );
  }

  try {
    const result = await generateLetter(parsed.data);
    return Response.json(result, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof LetterError) return errorResponse(error.code);
    return errorResponse("INTERNAL");
  }
}
