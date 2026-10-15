"use client";

// Design Ref: §1.1 화면 구성 — 왼쪽은 선택·입력, 오른쪽은 공문 초안.
// 선택·입력이 바뀌면 오른쪽 미리보기가 바로 바뀌고, [초안 만들기]를 누르면 AI가 완성한 초안으로 바뀐다.
// Plan SC: 필수 입력은 수신처 유형·요청 사항뿐, 입력값은 화면 메모리(React 상태)에만 둔다(브라우저 저장소 미사용).
import { useMemo, useState, type FormEvent } from "react";

import { CITIES, COUNTRIES, TITLES, parseDateInput } from "@/lib/letter/options";
import {
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
  recipientTypeNote: string;
  letterType: string;
  letterTypeNote: string;
  purpose: string;
  country: string;
  recipientOrg: string;
  recipientName: string;
  recipientTitle: string;
  dateText: string;
  placeCountry: string;
  placeCity: string;
  placeDetail: string;
  senderOrg: string;
  senderName: string;
  content: string;
};

const INITIAL: FormState = {
  language: "",
  formality: "",
  recipientType: "",
  recipientTypeNote: "",
  letterType: "",
  letterTypeNote: "",
  purpose: "",
  country: "",
  recipientOrg: "",
  recipientName: "",
  recipientTitle: "",
  dateText: "",
  placeCountry: "",
  placeCity: "",
  placeDetail: "",
  senderOrg: "",
  senderName: "",
  content: "",
};

type ErrorState = { message: string; fieldErrors: Record<string, string[]> };

const NETWORK_ERROR: ErrorState = {
  message: "서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  fieldErrors: {},
};

const FIELD_CLASS =
  "h-12 w-full rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none";

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
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  /** 칸 오른쪽 아래에 작게 보이는 안내(입력 방법) */
  hint?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-extrabold">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
      {hint ? (
        <span className="text-right text-xs font-bold text-foreground/50">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span role="alert" className="text-sm font-extrabold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/** 숫자만 남겨 2026 → 2026.1 → 2026.10.13 형태로 자동 변환한다. */
function formatDateTyping(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

const OTHER = "__other__";

/** 목록에서 고르거나, 목록에 없으면 '기타'를 눌러 직접 입력하는 칸 */
function SelectWithOther({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  maxLength,
}: {
  label?: string;
  ariaLabel: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  const [custom, setCustom] = useState(false);
  const selected = custom ? OTHER : options.includes(value) ? value : "";

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <span className="text-base font-extrabold">{label}</span> : null}
      <select
        aria-label={ariaLabel}
        value={selected}
        onChange={(event) => {
          const next = event.target.value;
          if (next === OTHER) {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(next);
          }
        }}
        className={FIELD_CLASS}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={OTHER}>기타 (직접 입력)</option>
      </select>
      {custom ? (
        <input
          type="text"
          aria-label={`${ariaLabel} 직접 입력`}
          value={value}
          maxLength={maxLength}
          autoFocus
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASS}
        />
      ) : null}
    </div>
  );
}

export default function LetterForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [result, setResult] = useState<LetterResponse | null>(null);
  /** AI 초안을 만들 때의 입력값. 이후 입력이 바뀌었는지 비교하는 데 쓴다. */
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const date = useMemo(() => parseDateInput(form.dateText), [form.dateText]);
  const place = [form.placeCountry, form.placeCity, form.placeDetail]
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join(", ");

  const snapshot = JSON.stringify(form);
  const stale = result !== null && generatedFor !== snapshot;

  /** 입력한 내용을 한눈에 모아 보여 주는 요약 (AI가 이 내용으로 공문을 만든다) */
  const labelOf = (
    items: readonly { value: string; label: string }[],
    value: string,
  ) => items.find((item) => item.value === value)?.label ?? "";
  const summary: { label: string; value: string }[] = [
    { label: "언어", value: labelOf(LANGUAGES, form.language) },
    { label: "문체", value: labelOf(FORMALITIES, form.formality) },
    {
      label: "대상 기관",
      value: [
        labelOf(RECIPIENT_TYPES, form.recipientType),
        form.recipientType === "other" ? form.recipientTypeNote.trim() : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      label: "공문 작성 목적",
      value: [
        labelOf(LETTER_TYPES, form.letterType),
        form.letterType === "other" ? form.letterTypeNote.trim() : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "요청 사항", value: form.purpose.trim() },
    { label: "받는 나라", value: form.country.trim() },
    { label: "받는 기관", value: form.recipientOrg.trim() },
    { label: "받는 사람", value: form.recipientName.trim() },
    { label: "받는 사람 직함", value: form.recipientTitle.trim() },
    { label: "일시", value: date.kind === "ok" ? date.korean : "" },
    { label: "장소", value: place },
    { label: "보내는 기관", value: form.senderOrg.trim() },
    { label: "보내는 사람", value: form.senderName.trim() },
    { label: "기타 전달 사항", value: form.content.trim() },
  ].filter((row) => row.value !== "");

  const fieldError = (key: string) => error?.fieldErrors[key]?.[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const missing: Record<string, string[]> = {};
    if (form.language === "") missing.language = ["언어를 선택해 주세요"];
    if (form.formality === "") missing.formality = ["문체를 선택해 주세요"];
    if (form.recipientType === "") missing.recipientType = ["대상 기관을 선택해 주세요"];
    if (form.letterType === "") missing.letterType = ["공문 작성 목적을 선택해 주세요"];
    if (form.purpose.trim() === "") missing.purpose = ["요청 사항을 입력해 주세요"];
    if (Object.keys(missing).length > 0) {
      setError({ message: "빠진 항목을 확인해 주세요.", fieldErrors: missing });
      return;
    }

    if (date.kind === "invalid") {
      setError({
        message: "일시를 확인해 주세요.",
        fieldErrors: {
          dateTime: [
            "20250212처럼 숫자 8자리로 입력해 주세요 (연도 4자리 + 월 2자리 + 일 2자리)",
          ],
        },
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // '기타'를 고르지 않은 경우의 직접 입력 칸 값은 보내지 않는다.
        body: JSON.stringify({
          language: form.language,
          formality: form.formality,
          recipientType: form.recipientType,
          recipientTypeNote:
            form.recipientType === "other" ? form.recipientTypeNote : "",
          letterType: form.letterType,
          letterTypeNote:
            form.letterType === "other" ? form.letterTypeNote : "",
          purpose: form.purpose,
          country: form.country,
          recipientOrg: form.recipientOrg,
          recipientName: form.recipientName,
          recipientTitle: form.recipientTitle,
          dateTime: date.kind === "ok" ? date.korean : "",
          place,
          senderOrg: form.senderOrg,
          senderName: form.senderName,
          content: form.content,
        }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (response.ok) {
        const parsed = letterResponseSchema.safeParse(body);
        if (parsed.success) {
          setResult(parsed.data);
          setGeneratedFor(snapshot);
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
    <div className="grid items-start gap-8 lg:grid-cols-2">
      {/* 왼쪽: 선택·입력 */}
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
          error={fieldError("language")}
        />
        <ChoiceGroup
          legend="② 문체 (격식 수준)"
          name="formality"
          options={FORMALITIES}
          value={form.formality}
          onChange={set("formality")}
          error={fieldError("formality")}
        />
        <ChoiceGroup
          legend="③ 대상 기관"
          name="recipientType"
          options={RECIPIENT_TYPES}
          value={form.recipientType}
          onChange={set("recipientType")}
          error={fieldError("recipientType")}
        />
        {form.recipientType === "other" ? (
          <TextField
            label="어떤 기관인가요? (기타)"
            value={form.recipientTypeNote}
            onChange={set("recipientTypeNote")}
            maxLength={LIMITS.recipientTypeNote}
            error={fieldError("recipientTypeNote")}
          />
        ) : null}
        <ChoiceGroup
          legend="④ 공문 작성 목적"
          name="letterType"
          options={LETTER_TYPES}
          value={form.letterType}
          onChange={set("letterType")}
          error={fieldError("letterType")}
        />
        {form.letterType === "other" ? (
          <TextField
            label="작성 목적을 직접 적어 주세요 (기타)"
            value={form.letterTypeNote}
            onChange={set("letterTypeNote")}
            maxLength={LIMITS.letterTypeNote}
            error={fieldError("letterTypeNote")}
          />
        ) : null}

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-extrabold">⑤ 내용</h2>
            <p className="mt-1 text-sm text-foreground/70">
              단어나 짧은 문장으로 적어도 됩니다. 비워 둔 칸은 사용하지
              않습니다.
            </p>
          </div>

          <TextField
            label="요청 사항 (한 줄) *"
            value={form.purpose}
            onChange={set("purpose")}
            maxLength={LIMITS.purpose}
            error={fieldError("purpose")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectWithOther
              label="받는 나라"
              ariaLabel="받는 나라"
              options={COUNTRIES}
              value={form.country}
              onChange={set("country")}
              maxLength={LIMITS.country}
            />
            <TextField
              label="받는 기관"
              value={form.recipientOrg}
              onChange={set("recipientOrg")}
              maxLength={LIMITS.recipientOrg}
              error={fieldError("recipientOrg")}
            />
            <TextField
              label="받는 사람"
              value={form.recipientName}
              onChange={set("recipientName")}
              maxLength={LIMITS.recipientName}
              error={fieldError("recipientName")}
            />
            <SelectWithOther
              label="받는 사람 직함"
              ariaLabel="받는 사람 직함"
              options={TITLES}
              value={form.recipientTitle}
              onChange={set("recipientTitle")}
              maxLength={LIMITS.recipientTitle}
            />

            <div className="sm:col-span-2">
              <TextField
                label="일시"
                value={form.dateText}
                onChange={(value) => set("dateText")(formatDateTyping(value))}
                maxLength={10}
                hint="입력 방법: 숫자 8자리로 적습니다. 예) 20261013 → 2026.10.13"
                error={fieldError("dateTime")}
              />
              {date.kind === "invalid" &&
              form.dateText.replace(/\D/g, "").length === 8 ? (
                <p className="mt-1 text-sm font-extrabold text-red-600">
                  없는 날짜입니다. 월·일을 확인해 주세요.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-base font-extrabold">장소</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  aria-label="장소 국가"
                  list="place-country-list"
                  value={form.placeCountry}
                  maxLength={LIMITS.place}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      placeCountry: value,
                      // 목록에서 다른 국가를 고르면 이전 국가의 도시는 비운다.
                      placeCity:
                        COUNTRIES.includes(value) &&
                        !(CITIES[value] ?? []).includes(prev.placeCity)
                          ? ""
                          : prev.placeCity,
                    }));
                  }}
                  className={FIELD_CLASS}
                />
                <input
                  type="text"
                  aria-label="장소 도시"
                  list="place-city-list"
                  value={form.placeCity}
                  maxLength={LIMITS.place}
                  onChange={(event) => set("placeCity")(event.target.value)}
                  className={FIELD_CLASS}
                />
                <input
                  type="text"
                  aria-label="세부 장소"
                  value={form.placeDetail}
                  maxLength={LIMITS.place}
                  onChange={(event) => set("placeDetail")(event.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs font-bold text-foreground/60">
                <span>국가</span>
                <span>도시</span>
                <span>세부 장소</span>
              </div>
            </div>

            <TextField
              label="보내는 기관"
              value={form.senderOrg}
              onChange={set("senderOrg")}
              maxLength={LIMITS.senderOrg}
              error={fieldError("senderOrg")}
            />
            <TextField
              label="보내는 사람"
              value={form.senderName}
              onChange={set("senderName")}
              maxLength={LIMITS.senderName}
              error={fieldError("senderName")}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-base font-extrabold">
              기타 전달 사항 (선택)
            </span>
            <textarea
              value={form.content}
              maxLength={LIMITS.content}
              rows={3}
              onChange={(event) => set("content")(event.target.value)}
              className="rounded-xl border-2 border-foreground/30 bg-background px-4 py-3 text-base focus-visible:border-accent focus-visible:outline-none"
            />
          </label>
          <p className="text-sm text-foreground/60">
            실명·연락처 대신 직함 위주로 적는 것을 권장합니다.
          </p>
        </div>

        <datalist id="place-country-list">
          {COUNTRIES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <datalist id="place-city-list">
          {(CITIES[form.placeCountry.trim()] ?? []).map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>

        <button
          type="submit"
          disabled={loading}
          className="h-14 rounded-full bg-accent text-xl font-extrabold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "AI가 공문을 만드는 중이에요…" : "AI로 공문 만들기"}
        </button>
      </form>

      {/* 오른쪽: 공문 초안 (입력이 바뀌면 미리보기가 바로 바뀐다) */}
      <section
        aria-live="polite"
        className="flex flex-col gap-4 lg:sticky lg:top-4"
      >
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
            AI가 입력한 내용으로 공문을 만들고 있어요. 보통 10초 안팎이 걸려요.
          </div>
        ) : null}

        {stale ? (
          <div
            role="status"
            className="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-4 text-base font-extrabold"
          >
            입력이 바뀌었어요. 아래 공문은 이전 입력 기준이에요. 새 입력을
            반영하려면 AI로 공문 만들기를 다시 눌러 주세요.
          </div>
        ) : null}

        {result && !loading ? (
          <LetterResult key={generatedFor} result={result} />
        ) : null}

        {!result && !loading ? (
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-foreground/15 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold">입력 내용 요약</h2>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-extrabold text-accent">
                AI가 공문으로 만들어요
              </span>
            </div>
            {summary.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-foreground/25 p-6 text-center text-base text-foreground/60">
                왼쪽에서 선택하고 입력하면 이곳에 내용이 모여요.
              </div>
            ) : (
              <dl className="flex flex-col divide-y divide-foreground/10 rounded-xl bg-foreground/5">
                {summary.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3"
                  >
                    <dt className="text-sm font-extrabold text-foreground/60">
                      {row.label}
                    </dt>
                    <dd className="break-words text-base">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="text-sm text-foreground/70">
              입력한 내용을 AI가 모아서 격식에 맞는 공문으로 만들어요. 다
              적었다면 왼쪽 아래 <span className="font-extrabold">AI로 공문 만들기</span>를
              눌러 주세요.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
