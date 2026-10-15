// Design Ref: §4.1 POST /api/letters, §4.2 오류 응답 — 공문 생성 API
import { LetterError, generateLetter } from "@/lib/letter/generate";
import { allowRequest, clientKey } from "@/lib/letter/rate-limit";
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
  // 로그인 없이 쓰는 서비스로 결정했으므로 로그인 검사는 하지 않는다(2026-10-15).
  // 대신 비용 남용을 막기 위해 같은 접속자의 호출 횟수를 제한한다.
  if (!allowRequest(clientKey(request))) return errorResponse("RATE_LIMITED");

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
