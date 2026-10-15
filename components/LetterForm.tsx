"use client";

// Design Ref: §1.1 입력 영역 — 언어·문체·대상·공문 종류를 고르고 내용을 적어 초안을 만든다.
// Plan SC: 필수 입력은 수신처 유형·목적뿐, 입력값은 화면 메모리(React 상태)에만 둔다(브라우저 저장소 미사용).
import { useState, type FormEvent } from "react";

import {
  DEFAULT_FORMALITY,
  DEFAULT_LANGUAGE,
  DEFAULT_LETTER_TYPE,
  FORMALITIES,
  LANGUAGES,
  LETTER_TYPES,
  LIMITS,
  RECIPIENT_TYPES,
  errorResponseSchema,
  letterResponseSchema,
  type LetterResponse,
} from "@/lib/letter/schema";

import LetterResult from "./LetterResult";

type FormState = {
  language: string;
  formality: string;
  recipientType: string;
  letterType: string;
  purpose: string;
  content: string;
  country: string;
  recipientOrg: string;
  recipientName: string;
  recipientTitle: string;
  senderOrg: string;
  senderName: string;
};

const INITIAL: FormState = {
  language: DEFAULT_LANGUAGE,
  formality: DEFAULT_FORMALITY,
  recipientType: "",
  letterType: DEFAULT_LETTER_TYPE,
  purpose: "",
  content: "",
  country: "",
  recipientOrg: "",
  recipientName: "",
  recipientTitle: "",
  senderOrg: "",
  senderName: "",
};

type ErrorState = { message: string; fieldErrors: Record<string, string[]> };

const NETWORK_ERROR: ErrorState = {
  message: "서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  fieldErrors: {},
};

function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-lg font-extrabold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              aria-label={option.label}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-12 items-center rounded-full border-2 border-foreground/30 px-5 text-base font-extrabold transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-accent">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-base font-extrabold text-red-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-extrabold">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
      />
      {error ? (
        <span role="alert" className="text-sm font-extrabold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export default function LetterForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [result, setResult] = useState<LetterResponse | null>(null);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fieldError = (key: string) => error?.fieldErrors[key]?.[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body: unknown = await response.json().catch(() => null);

      if (response.ok) {
        const parsed = letterResponseSchema.safeParse(body);
        if (parsed.success) {
          setResult(parsed.data);
        } else {
          setError({
            message: "초안을 만들지 못했습니다. 다시 시도해 주세요.",
            fieldErrors: {},
          });
        }
      } else {
        const parsed = errorResponseSchema.safeParse(body);
        setError(
          parsed.success
            ? {
                message: parsed.data.error.message,
                fieldErrors: parsed.data.error.fieldErrors ?? {},
              }
            : {
                message: "일시적인 오류입니다. 다시 시도해 주세요.",
                fieldErrors: {},
              },
        );
      }
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-3xl border-2 border-foreground/15 p-5 sm:p-7"
      >
        <ChoiceGroup
          legend="① 언어 선택"
          name="language"
          options={LANGUAGES}
          value={form.language}
          onChange={set("language")}
        />
        <ChoiceGroup
          legend="② 문체 (격식 수준)"
          name="formality"
          options={FORMALITIES}
          value={form.formality}
          onChange={set("formality")}
        />
        <ChoiceGroup
          legend="③ 대상 (받는 곳)"
          name="recipientType"
          options={RECIPIENT_TYPES}
          value={form.recipientType}
          onChange={set("recipientType")}
          error={fieldError("recipientType")}
        />
        <ChoiceGroup
          legend="공문 종류"
          name="letterType"
          options={LETTER_TYPES}
          value={form.letterType}
          onChange={set("letterType")}
        />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold">④ 내용</h2>
          <TextField
            label="목적 (한 줄) *"
            value={form.purpose}
            onChange={set("purpose")}
            maxLength={LIMITS.purpose}
            placeholder="예: 전시회 참가를 위한 협조 요청"
            error={fieldError("purpose")}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-extrabold">핵심 내용</span>
            <textarea
              value={form.content}
              maxLength={LIMITS.content}
              rows={6}
              placeholder="전달할 내용을 한국어로 자유롭게 적어 주세요."
              onChange={(event) => set("content")(event.target.value)}
              className="rounded-xl border-2 border-foreground/30 bg-background px-4 py-3 text-base focus-visible:border-accent focus-visible:outline-none"
            />
            <span className="text-right text-sm text-foreground/60">
              {form.content.length} / {LIMITS.content}
            </span>
          </label>
        </div>

        <details className="rounded-2xl border-2 border-foreground/15 p-4">
          <summary className="cursor-pointer text-base font-extrabold">
            추가 정보 입력 (선택)
          </summary>
          <p className="mt-2 text-sm text-foreground/70">
            실명·연락처 대신 직함 위주로 적는 것을 권장합니다. 비워 두면 해당
            부분은 <span className="font-extrabold">[ ]</span>로 남기도록
            안내합니다.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="수신 국가"
              value={form.country}
              onChange={set("country")}
              maxLength={LIMITS.country}
              error={fieldError("country")}
            />
            <TextField
              label="수신 기관"
              value={form.recipientOrg}
              onChange={set("recipientOrg")}
              maxLength={LIMITS.recipientOrg}
              error={fieldError("recipientOrg")}
            />
            <TextField
              label="수신 담당자"
              value={form.recipientName}
              onChange={set("recipientName")}
              maxLength={LIMITS.recipientName}
              error={fieldError("recipientName")}
            />
            <TextField
              label="수신자 직함"
              value={form.recipientTitle}
              onChange={set("recipientTitle")}
              maxLength={LIMITS.recipientTitle}
              error={fieldError("recipientTitle")}
            />
            <TextField
              label="발신 기관"
              value={form.senderOrg}
              onChange={set("senderOrg")}
              maxLength={LIMITS.senderOrg}
              error={fieldError("senderOrg")}
            />
            <TextField
              label="발신 담당자"
              value={form.senderName}
              onChange={set("senderName")}
              maxLength={LIMITS.senderName}
              error={fieldError("senderName")}
            />
          </div>
        </details>

        <button
          type="submit"
          disabled={loading}
          className="h-14 rounded-full bg-accent text-xl font-extrabold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "초안을 만드는 중입니다…" : "초안 만들기"}
        </button>
      </form>

      <section aria-live="polite" className="flex flex-col gap-4">
        {error ? (
          <div
            role="alert"
            className="rounded-2xl border-2 border-red-500/60 bg-red-500/10 p-5"
          >
            <p className="text-lg font-extrabold">{error.message}</p>
            <p className="mt-1 text-sm text-foreground/70">
              입력한 내용은 그대로 남아 있습니다.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border-2 border-foreground/15 p-8 text-center text-lg font-extrabold">
            초안을 만드는 중입니다… 보통 10초 안팎이 걸립니다.
          </div>
        ) : null}

        {result ? <LetterResult result={result} /> : null}

        {!result && !loading && !error ? (
          <div className="rounded-2xl border-2 border-dashed border-foreground/25 p-8 text-center text-lg text-foreground/70">
            왼쪽에서 언어·문체·대상을 고르고 내용을 적은 뒤{" "}
            <span className="font-extrabold">초안 만들기</span>를 눌러 주세요.
          </div>
        ) : null}
      </section>
    </div>
  );
}
