// PDF(사업 계획서·세미나 포스터 등)를 올리면 그 내용으로 공문 초안을 만드는 API.
// 입력은 multipart/form-data: file(PDF) + 선택 항목. 파일은 저장하지 않고 AI에게만 전달한다.
import { LetterError, extractPdfFacts, generateLetter } from "@/lib/letter/generate";
import { allowRequest, clientKey } from "@/lib/letter/rate-limit";
import {
  ERROR_CODES,
  letterRequestSchema,
  toErrorResponse,
  type ErrorCode,
} from "@/lib/letter/schema";

export const maxDuration = 60;

/** 서버리스 요청 본문 한도(약 4.5MB)보다 작게 잡는다 */
const MAX_PDF_BYTES = 4 * 1024 * 1024;
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

const DEFAULT_PURPOSE =
  "PDF에 담긴 행사·사업의 내용(행사명, 일시, 장소, 주최, 목적)을 직접 풀어 써서 외국 기관에 알리고 참석·협조를 요청하는 공문";

export async function POST(request: Request): Promise<Response> {
  if (!allowRequest(clientKey(request))) return errorResponse("RATE_LIMITED");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("INVALID_INPUT");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("INVALID_INPUT", { file: ["PDF 파일을 올려 주세요"] });
  }
  if (file.size === 0 || file.size > MAX_PDF_BYTES) {
    return errorResponse("INVALID_INPUT", {
      file: ["PDF 파일은 4MB 이하로 올려 주세요"],
    });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  // 확장자·형식 표시는 속일 수 있으므로 파일 맨 앞의 PDF 표식을 직접 확인한다.
  const isPdf =
    bytes.length > 4 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "%PDF";
  if (!isPdf) {
    return errorResponse("INVALID_INPUT", {
      file: ["PDF 파일만 올릴 수 있어요"],
    });
  }

  const text = (key: string): string => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  const note = text("purpose").trim();
  const parsed = letterRequestSchema.safeParse({
    language: text("language") || undefined,
    chineseScript: text("chineseScript") || undefined,
    formality: text("formality") || undefined,
    recipientType: text("recipientType"),
    recipientTypeNote: text("recipientTypeNote"),
    letterType: text("letterType") || undefined,
    letterTypeNote: text("letterTypeNote"),
    purpose: note === "" ? DEFAULT_PURPOSE : note,
  });
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return errorResponse(
      "INVALID_INPUT",
      fieldErrors as Record<string, string[]>,
    );
  }

  try {
    // 1단계: PDF에서 사실만 뽑는다. 2단계: 그 사실을 입력 내용으로 삼아 기존 방식대로 공문을 만든다.
    const facts = await extractPdfFacts(Buffer.from(bytes).toString("base64"));
    const result = await generateLetter({
      ...parsed.data,
      content: `[PDF에서 읽은 내용]\n${facts}`,
    });
    return Response.json(result, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof LetterError) return errorResponse(error.code);
    return errorResponse("INTERNAL");
  }
}
