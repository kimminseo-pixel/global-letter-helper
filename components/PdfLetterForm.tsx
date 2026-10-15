"use client";

// PDF(사업 계획서·세미나 포스터 등)를 올리면 AI가 내용을 읽고 공문 초안을 만든다.
// 입력값과 파일은 화면 메모리에만 두고, 서버에도 저장하지 않는다.
import { useState, type FormEvent } from "react";

import {
  CHINESE_SCRIPTS,
  FORMALITIES,
  LANGUAGES,
  LETTER_TYPES,
  LIMITS,
  RECIPIENT_TYPES,
  errorResponseSchema,
  letterResponseSchema,
  type LetterResponse,
} from "@/lib/letter/schema";

import {
  ChoiceGroup,
  NETWORK_ERROR,
  TextField,
  type ErrorState,
} from "./LetterForm";
import LetterResult from "./LetterResult";

const MAX_BYTES = 4 * 1024 * 1024;

export default function PdfLetterForm() {
  const [language, setLanguage] = useState("");
  const [chineseScript, setChineseScript] = useState("");
  const [formality, setFormality] = useState("");
  const [recipientType, setRecipientType] = useState("");
  const [recipientTypeNote, setRecipientTypeNote] = useState("");
  const [letterType, setLetterType] = useState("");
  const [letterTypeNote, setLetterTypeNote] = useState("");
  const [purpose, setPurpose] = useState("");
  const [recipientOrg, setRecipientOrg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [result, setResult] = useState<LetterResponse | null>(null);
  const [resultLanguage, setResultLanguage] = useState("");

  const fieldError = (key: string) => error?.fieldErrors[key]?.[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const missing: Record<string, string[]> = {};
    if (file === null) missing.file = ["PDF 파일을 올려 주세요"];
    else if (file.size > MAX_BYTES)
      missing.file = ["PDF 파일은 4MB 이하로 올려 주세요"];
    if (recipientOrg.trim() === "")
      missing.recipientOrg = [
        "누구에게 보내는지 받는 기관이나 받는 사람을 적어 주세요",
      ];
    if (language === "") missing.language = ["언어를 선택해 주세요"];
    if (language === "zh" && chineseScript === "")
      missing.chineseScript = ["간체 또는 번체를 선택해 주세요"];
    if (formality === "") missing.formality = ["문체를 선택해 주세요"];
    if (recipientType === "") missing.recipientType = ["대상 기관을 선택해 주세요"];
    if (letterType === "") missing.letterType = ["공문 작성 목적을 선택해 주세요"];
    if (Object.keys(missing).length > 0 || file === null) {
      setError({ message: "빠진 항목을 확인해 주세요.", fieldErrors: missing });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const body = new FormData();
    body.append("file", file);
    body.append("language", language);
    if (language === "zh") body.append("chineseScript", chineseScript);
    body.append("formality", formality);
    body.append("recipientType", recipientType);
    body.append("recipientTypeNote", recipientType === "other" ? recipientTypeNote : "");
    body.append("letterType", letterType);
    body.append("letterTypeNote", letterType === "other" ? letterTypeNote : "");
    body.append("purpose", purpose);
    body.append("recipientOrg", recipientOrg);

    try {
      const response = await fetch("/api/letters/pdf", { method: "POST", body });
      const json: unknown = await response.json().catch(() => null);
      if (response.ok) {
        const parsed = letterResponseSchema.safeParse(json);
        if (parsed.success) {
          setResult(parsed.data);
          setResultLanguage(language);
        } else {
          setError({
            message: "초안을 만들지 못했습니다. 다시 시도해 주세요.",
            fieldErrors: {},
          });
        }
      } else {
        const parsed = errorResponseSchema.safeParse(json);
        setError(
          parsed.success
            ? {
                message: parsed.data.error.message,
                fieldErrors: parsed.data.error.fieldErrors ?? {},
              }
            : { message: "일시적인 오류입니다. 다시 시도해 주세요.", fieldErrors: {} },
        );
      }
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-3xl border-2 border-foreground/15 p-5 sm:p-7"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="pdf-file" className="text-lg font-extrabold">
            ① PDF 파일 올리기
          </label>
          <input
            id="pdf-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-xl border-2 border-dashed border-foreground/30 p-4 text-base file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:font-extrabold file:text-accent-foreground"
          />
          <p className="text-sm text-foreground/60">
            사업 계획서, 세미나 포스터 등 · 4MB 이하 · 올린 파일은 저장하지
            않아요.
          </p>
          {fieldError("file") ? (
            <p role="alert" className="text-base font-extrabold text-red-600">
              {fieldError("file")}
            </p>
          ) : null}
        </div>

        <ChoiceGroup
          legend="② 언어 선택"
          name="pdf-language"
          options={LANGUAGES}
          value={language}
          onChange={setLanguage}
          error={fieldError("language")}
          sub={{
            parent: "zh",
            name: "pdf-chineseScript",
            options: CHINESE_SCRIPTS,
            value: chineseScript,
            onChange: setChineseScript,
            error: fieldError("chineseScript"),
          }}
        />
        <ChoiceGroup
          legend="③ 문체 (격식 수준)"
          name="pdf-formality"
          options={FORMALITIES}
          value={formality}
          onChange={setFormality}
          error={fieldError("formality")}
        />
        <ChoiceGroup
          legend="④ 대상 기관"
          name="pdf-recipientType"
          options={RECIPIENT_TYPES}
          value={recipientType}
          onChange={setRecipientType}
          error={fieldError("recipientType")}
        />
        {recipientType === "other" ? (
          <TextField
            label="어떤 기관인가요? (기타)"
            value={recipientTypeNote}
            onChange={setRecipientTypeNote}
            maxLength={LIMITS.recipientTypeNote}
          />
        ) : null}
        <ChoiceGroup
          legend="⑤ 공문 작성 목적"
          name="pdf-letterType"
          options={LETTER_TYPES}
          value={letterType}
          onChange={setLetterType}
          error={fieldError("letterType")}
        />
        {letterType === "other" ? (
          <TextField
            label="작성 목적을 직접 적어 주세요 (기타)"
            value={letterTypeNote}
            onChange={setLetterTypeNote}
            maxLength={LIMITS.letterTypeNote}
          />
        ) : null}
        <TextField
          label="⑥ 받는 기관 또는 사람"
          value={recipientOrg}
          onChange={setRecipientOrg}
          maxLength={LIMITS.recipientOrg}
          hint="예) 호주 통상부 / Mr. John Smith"
          error={fieldError("recipientOrg")}
        />
        <TextField
          label="⑦ 덧붙일 요청 (선택)"
          value={purpose}
          onChange={setPurpose}
          maxLength={LIMITS.purpose}
          hint="예) 발표자로 초청하고 싶어요 / 비워 두면 PDF 내용만 보고 만들어요"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-14 rounded-2xl bg-accent text-xl font-extrabold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "PDF를 읽고 공문을 만드는 중이에요…" : "PDF로 공문 만들기"}
        </button>
      </form>

      <section aria-live="polite" className="flex flex-col gap-4 lg:sticky lg:top-4">
        {error ? (
          <div
            role="alert"
            className="rounded-2xl border-2 border-red-500/60 bg-red-500/10 p-5"
          >
            <p className="text-lg font-extrabold">{error.message}</p>
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-2xl border-2 border-foreground/15 p-8 text-center text-lg font-extrabold">
            AI가 PDF를 읽고 공문을 만들고 있어요. 20초 안팎이 걸릴 수 있어요.
          </div>
        ) : null}
        {result && !loading ? (
          <LetterResult result={result} language={resultLanguage} />
        ) : null}
        {!result && !loading ? (
          <div className="rounded-2xl border-2 border-foreground/15 p-5 text-base">
            <h2 className="text-lg font-extrabold">이렇게 만들어져요</h2>
            <ol className="mt-2 list-decimal pl-5 leading-7">
              <li>PDF를 올리면 AI가 행사명·일시·장소·기관 같은 핵심을 읽어요.</li>
              <li>고른 언어와 문체에 맞는 공문 초안과 한국어 확인본을 만들어요.</li>
              <li>PDF에 없는 내용은 지어내지 않고 &quot;빠진 항목&quot;으로 알려 줘요.</li>
            </ol>
            <p className="mt-3 text-sm text-foreground/70">
              PDF 내용은 외부 AI 서비스로 전송돼요. 대외비·기밀 문서는 올리지
              마세요.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
