// 받는 나라의 주요 인사를 웹 검색으로 찾아 참고용으로 돌려주는 API
import { LetterError } from "@/lib/letter/generate";
import { findOfficials, officialsRequestSchema } from "@/lib/letter/officials";
import { allowRequest, clientKey } from "@/lib/letter/rate-limit";
import { ERROR_CODES, toErrorResponse, type ErrorCode } from "@/lib/letter/schema";

export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(code: ErrorCode): Response {
  return Response.json(toErrorResponse(code), {
    status: ERROR_CODES[code].status,
    headers: NO_STORE,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!allowRequest(clientKey(request))) return errorResponse("RATE_LIMITED");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT");
  }
  const parsed = officialsRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("INVALID_INPUT");
  try {
    const officials = await findOfficials(parsed.data.country, parsed.data.topic);
    return Response.json({ officials }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof LetterError) return errorResponse(error.code);
    return errorResponse("INTERNAL");
  }
}
