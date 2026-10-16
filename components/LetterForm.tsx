"use client";

// Design Ref: §1.1 화면 구성 — 왼쪽은 선택·입력, 오른쪽은 공문 초안.
// 선택·입력이 바뀌면 오른쪽 미리보기가 바로 바뀌고, [초안 만들기]를 누르면 AI가 완성한 초안으로 바뀐다.
// Plan SC: 필수 입력은 수신처 유형·요청 사항뿐, 입력값은 화면 메모리(React 상태)에만 둔다(브라우저 저장소 미사용).
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CITIES,
  COUNTRIES,
  TITLES,
  suggestedCountries,
  parseDateInput,
} from "@/lib/letter/options";
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

import { PREFILL_EVENT, PREFILL_KEY } from "./HeaderQuickStart";
import LetterResult from "./LetterResult";

type FormState = {
  language: string;
  chineseScript: string;
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

/** 한 번에 여러 곳에 보낼 때 추가하는 받는 곳 */
type Recipient = {
  country: string;
  org: string;
  name: string;
  title: string;
};

const EMPTY_RECIPIENT: Recipient = {
  country: "",
  org: "",
  name: "",
  title: "",
};
/** 기본 받는 곳을 포함해 최대 5곳 (호출 횟수 제한 안에서 한 번에 만든다) */
const MAX_EXTRAS = 4;

const INITIAL: FormState = {
  language: "",
  chineseScript: "",
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

export type ErrorState = {
  message: string;
  fieldErrors: Record<string, string[]>;
};

export const NETWORK_ERROR: ErrorState = {
  message:
    "서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  fieldErrors: {},
};

export const FIELD_CLASS =
  "h-12 w-full rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none";

export function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  sub,
}: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** 특정 선택지 바로 아래에 작게 붙는 하위 선택(예: 중국어 → 간체·번체) */
  sub?: {
    parent: string;
    name: string;
    options: readonly { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
  };
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-lg font-extrabold">{legend}</legend>
      <div className="flex flex-wrap items-start gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex flex-col items-start gap-1.5">
            <label className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                aria-label={option.label}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-12 items-center rounded-xl border-2 border-foreground/30 px-5 text-base font-extrabold transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-accent">
                {option.label}
              </span>
            </label>
            {sub && value === sub.parent && option.value === sub.parent ? (
              <div className="flex gap-1.5 pl-1">
                {sub.options.map((subOption) => (
                  <label key={subOption.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name={sub.name}
                      value={subOption.value}
                      checked={sub.value === subOption.value}
                      aria-label={subOption.label}
                      onChange={() => sub.onChange(subOption.value)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-8 items-center rounded-lg border border-foreground/25 px-3 text-sm font-extrabold transition peer-checked:border-foreground/20 peer-checked:bg-foreground/15 peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:bg-foreground/5">
                      {subOption.label}
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {sub?.error ? (
        <p role="alert" className="text-base font-extrabold text-red-600">
          {sub.error}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-base font-extrabold text-red-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function TextField({
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

/**
 * 글자를 치면 바로 일치하는 항목이 목록에 나타나는 입력 칸.
 * 목록에서 고르거나, 목록에 없으면(기타) 그대로 직접 입력하면 된다.
 */
function ComboField({
  label,
  ariaLabel,
  listId,
  options,
  value,
  onChange,
  maxLength,
}: {
  label?: string;
  ariaLabel: string;
  listId: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-base font-extrabold">{label}</span> : null}
      <input
        type="text"
        aria-label={ariaLabel}
        list={listId}
        value={value}
        maxLength={maxLength}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

const DRAFT_KEY = "gongmun-draft-v1";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SavedDraft = { savedAt: number; form: FormState; extras: Recipient[] };

/** 이 브라우저에만 저장된 임시저장을 읽는다(7일이 지나면 없는 것으로 본다). */
function readDraft(): SavedDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw === null) return null;
    const data = JSON.parse(raw) as SavedDraft;
    if (
      typeof data.savedAt !== "number" ||
      Date.now() - data.savedAt > DRAFT_TTL_MS ||
      typeof data.form !== "object" ||
      data.form === null
    ) {
      window.localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export default function LetterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [officials, setOfficials] = useState<
    { title: string; name: string; organization: string; sourceUrl: string }[]
  >([]);
  const [officialsFor, setOfficialsFor] = useState("");
  const [officialsLoading, setOfficialsLoading] = useState(false);
  const [officialsError, setOfficialsError] = useState("");
  const [extras, setExtras] = useState<Recipient[]>([]);
  const [results, setResults] = useState<
    { label: string; result: LetterResponse }[]
  >([]);
  const [active, setActive] = useState(0);
  /** 이 브라우저에 임시저장된 내용(있으면 불러오기를 안내한다) */
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  /** 작성 중 다른 화면으로 나가려 할 때 보여 주는 확인 창 */
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [failedLabels, setFailedLabels] = useState<string[]>([]);
  const result = results[active]?.result ?? null;
  /** AI 초안을 만들 때의 입력값. 이후 입력이 바뀌었는지 비교하는 데 쓴다. */
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);
  /** 결과를 만들 때 선택했던 언어(제목 줄 이름표와 위치를 정하는 데 쓴다) */
  const [generatedLanguage, setGeneratedLanguage] = useState("");

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const countryOptions = useMemo(
    () => suggestedCountries(form.language, `${form.purpose} ${form.content}`),
    [form.language, form.purpose, form.content],
  );
  const date = useMemo(() => parseDateInput(form.dateText), [form.dateText]);
  const place = [form.placeCountry, form.placeCity, form.placeDetail]
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join(", ");

  const snapshot = JSON.stringify({ form, extras });
  const stale = result !== null && generatedFor !== snapshot;

  /** 입력한 내용을 한눈에 모아 보여 주는 요약 (AI가 이 내용으로 공문을 만든다) */
  const labelOf = (
    items: readonly { value: string; label: string }[],
    value: string,
  ) => items.find((item) => item.value === value)?.label ?? "";
  const summary: { label: string; value: string }[] = [
    { label: "언어", value: labelOf(LANGUAGES, form.language) },
    ...(form.language === "zh"
      ? [
          {
            label: "글자체",
            value: labelOf(CHINESE_SCRIPTS, form.chineseScript),
          },
        ]
      : []),
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
    {
      label: "추가 받는 곳",
      value: extras
        .map((r) => r.org.trim() || r.name.trim() || r.title.trim())
        .filter(Boolean)
        .join(", "),
    },
    { label: "일시", value: date.kind === "ok" ? date.korean : "" },
    { label: "장소", value: place },
    { label: "보내는 기관", value: form.senderOrg.trim() },
    { label: "보내는 사람", value: form.senderName.trim() },
    { label: "기타 전달 사항", value: form.content.trim() },
  ].filter((row) => row.value !== "");

  const fieldError = (key: string) => error?.fieldErrors[key]?.[0];

  /** 입력한 내용이 하나라도 있으면 작성 중으로 본다. */
  const dirty =
    JSON.stringify(form) !== JSON.stringify(INITIAL) ||
    extras.some((r) => Object.values(r).some((v) => v.trim() !== ""));

  // 화면에 들어올 때마다 임시저장 여부를 확인한다.
  useEffect(() => {
    const id = window.setTimeout(() => setSavedDraft(readDraft()), 0);
    return () => window.clearTimeout(id);
  }, []);

  // 머리글 입력창에 적은 요청 사항을 "요청 사항" 칸에 채운다.
  useEffect(() => {
    const fill = (text: string) => {
      const purpose = text.trim().slice(0, LIMITS.purpose);
      if (purpose !== "") setForm((prev) => ({ ...prev, purpose }));
    };
    const id = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem(PREFILL_KEY);
        if (saved !== null) {
          window.sessionStorage.removeItem(PREFILL_KEY);
          fill(saved);
        }
      } catch {
        /* 저장소를 쓸 수 없으면 채우지 않는다 */
      }
    }, 0);
    const onPrefill = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        fill(event.detail);
      }
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(PREFILL_EVENT, onPrefill);
    };
  }, []);

  // 다른 화면에 갔다 돌아오면 처음 상태로 새로 시작한다(화면이 숨겨질 때 입력을 비운다).
  useLayoutEffect(() => {
    return () => {
      setForm(INITIAL);
      setExtras([]);
      setResults([]);
      setFailedLabels([]);
      setError(null);
      setActive(0);
      setOfficials([]);
      setDraftNotice("");
      setLeaveTo(null);
      setSavedDraft(readDraft());
    };
  }, []);

  // 새로고침·탭 닫기: 저장되지 않는다는 브라우저 기본 경고를 띄운다.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // 작성 중에 사이트 안의 다른 화면으로 가는 링크를 누르면 확인 창을 띄운다.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveTo(url.pathname + url.search);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [dirty]);

  /** 지금 입력한 내용을 이 브라우저에만 임시저장한다(서버로 보내지 않는다). */
  function saveDraft(): boolean {
    try {
      const data: SavedDraft = { savedAt: Date.now(), form, extras };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setSavedDraft(data);
      setDraftNotice(
        "임시저장했어요. 이 브라우저에만 저장되고 7일 뒤 사라져요.",
      );
      return true;
    } catch {
      setDraftNotice(
        "임시저장하지 못했어요. 브라우저의 저장 기능이 막혀 있을 수 있어요.",
      );
      return false;
    }
  }

  function loadDraft() {
    if (savedDraft === null) return;
    setForm({ ...INITIAL, ...savedDraft.form });
    setExtras(savedDraft.extras ?? []);
    setResults([]);
    setDraftNotice("임시저장한 내용을 불러왔어요.");
  }

  function deleteDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* 저장소를 쓸 수 없으면 지울 것도 없다 */
    }
    setSavedDraft(null);
    setDraftNotice("임시저장을 지웠어요.");
  }

  /** 받는 나라의 주요 인사를 웹 검색으로 찾아 미리 보여 준다(참고용). */
  async function loadOfficials() {
    const country = form.country.trim();
    if (officialsLoading || country === "") return;
    setOfficialsLoading(true);
    setOfficialsError("");
    setOfficials([]);
    setOfficialsFor(country);
    try {
      const response = await fetch("/api/officials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, topic: form.purpose }),
      });
      const body: unknown = await response.json().catch(() => null);
      const list =
        body !== null && typeof body === "object" && "officials" in body
          ? (body as { officials: unknown }).officials
          : null;
      if (response.ok && Array.isArray(list)) {
        setOfficials(
          list.filter(
            (
              item,
            ): item is {
              title: string;
              name: string;
              organization: string;
              sourceUrl: string;
            } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { name?: unknown }).name === "string",
          ),
        );
        if (list.length === 0)
          setOfficialsError("확인된 인사를 찾지 못했어요. 직접 입력해 주세요.");
      } else {
        setOfficialsError(
          "인사 정보를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
      }
    } catch {
      setOfficialsError("서버에 연결하지 못했어요.");
    } finally {
      setOfficialsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const missing: Record<string, string[]> = {};
    if (form.language === "") missing.language = ["언어를 선택해 주세요"];
    if (form.language === "zh" && form.chineseScript === "")
      missing.chineseScript = ["간체 또는 번체를 선택해 주세요"];
    if (form.formality === "") missing.formality = ["문체를 선택해 주세요"];
    if (form.recipientType === "")
      missing.recipientType = ["대상 기관을 선택해 주세요"];
    if (form.letterType === "")
      missing.letterType = ["공문 작성 목적을 선택해 주세요"];
    if (form.purpose.trim() === "")
      missing.purpose = ["요청 사항을 입력해 주세요"];
    if (
      extras.some((r) => [r.org, r.name, r.title].every((t) => t.trim() === ""))
    )
      missing.extras = [
        "추가한 받는 곳에도 받는 기관이나 받는 사람을 적어 주세요",
      ];
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
    setResults([]);
    setFailedLabels([]);

    const recipients: Recipient[] = [
      {
        country: form.country,
        org: form.recipientOrg,
        name: form.recipientName,
        title: form.recipientTitle,
      },
      ...extras,
    ];
    const labelFor = (r: Recipient, index: number) =>
      r.org.trim() || r.name.trim() || r.title.trim() || `받는 곳 ${index + 1}`;

    /** 한 곳에 보낼 공문을 만든다. 성공하면 결과, 실패하면 오류 상태를 돌려준다. */
    const requestOne = async (
      r: Recipient,
    ): Promise<
      { ok: true; data: LetterResponse } | { ok: false; error: ErrorState }
    > => {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // '기타'를 고르지 않은 경우의 직접 입력 칸 값은 보내지 않는다.
        body: JSON.stringify({
          language: form.language,
          chineseScript:
            form.language === "zh" ? form.chineseScript : undefined,
          formality: form.formality,
          recipientType: form.recipientType,
          recipientTypeNote:
            form.recipientType === "other" ? form.recipientTypeNote : "",
          letterType: form.letterType,
          letterTypeNote:
            form.letterType === "other" ? form.letterTypeNote : "",
          purpose: form.purpose,
          country: r.country,
          recipientOrg: r.org,
          recipientName: r.name,
          recipientTitle: r.title,
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
        if (parsed.success) return { ok: true, data: parsed.data };
        return {
          ok: false,
          error: {
            message: "초안을 만들지 못했습니다. 다시 시도해 주세요.",
            fieldErrors: {},
          },
        };
      }
      const parsed = errorResponseSchema.safeParse(body);
      return {
        ok: false,
        error: parsed.success
          ? {
              message: parsed.data.error.message,
              fieldErrors: parsed.data.error.fieldErrors ?? {},
            }
          : {
              message: "일시적인 오류입니다. 다시 시도해 주세요.",
              fieldErrors: {},
            },
      };
    };

    try {
      const outcomes = await Promise.all(recipients.map((r) => requestOne(r)));
      const done: { label: string; result: LetterResponse }[] = [];
      const failed: string[] = [];
      let firstError: ErrorState | null = null;
      outcomes.forEach((outcome, index) => {
        const label = labelFor(recipients[index], index);
        if (outcome.ok) done.push({ label, result: outcome.data });
        else {
          failed.push(label);
          firstError ??= outcome.error;
        }
      });
      if (done.length > 0) {
        setResults(done);
        setActive(0);
        setFailedLabels(failed);
        setGeneratedFor(snapshot);
        setGeneratedLanguage(form.language);
      } else if (firstError !== null) {
        setError(firstError);
      }
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {savedDraft !== null && !dirty ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent/40 bg-accent/10 p-4"
        >
          <span className="text-base font-extrabold">
            임시저장한 내용이 있어요 (
            {new Date(savedDraft.savedAt).toLocaleString("ko-KR")})
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={loadDraft}
              className="h-10 rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground"
            >
              불러오기
            </button>
            <button
              type="button"
              onClick={deleteDraft}
              className="h-10 rounded-xl border-2 border-foreground/30 px-4 text-base font-extrabold"
            >
              지우기
            </button>
          </span>
        </div>
      ) : null}
      {draftNotice !== "" ? (
        <p role="status" className="text-base font-extrabold text-accent">
          {draftNotice}
        </p>
      ) : null}

      {leaveTo !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="작성 중인 내용 안내"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-background p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold">
              작성 중인 내용이 저장되지 않아요
            </h2>
            <p className="text-base">
              지금 나가면 입력한 내용이 사라져요. 임시저장하면 다음에 이
              화면에서 불러올 수 있어요.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const to = leaveTo;
                  if (saveDraft()) router.push(to);
                  else setLeaveTo(null);
                }}
                className="h-12 rounded-xl bg-accent text-base font-extrabold text-accent-foreground"
              >
                임시저장하고 나가기
              </button>
              <button
                type="button"
                onClick={() => {
                  const to = leaveTo;
                  setLeaveTo(null);
                  router.push(to);
                }}
                className="h-12 rounded-xl border-2 border-foreground/30 text-base font-extrabold"
              >
                저장하지 않고 나가기
              </button>
              <button
                type="button"
                onClick={() => setLeaveTo(null)}
                className="h-12 rounded-xl text-base font-extrabold text-foreground/70"
              >
                계속 작성하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 [&>*]:min-w-0">
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
            sub={{
              parent: "zh",
              name: "chineseScript",
              options: CHINESE_SCRIPTS,
              value: form.chineseScript,
              onChange: set("chineseScript"),
              error: fieldError("chineseScript"),
            }}
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

            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-extrabold">받는 곳 1</span>
              <button
                type="button"
                disabled={extras.length >= MAX_EXTRAS}
                onClick={() =>
                  setExtras((prev) => [...prev, { ...EMPTY_RECIPIENT }])
                }
                className="h-10 rounded-xl border-2 border-accent px-4 text-base font-extrabold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + 추가하기
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ComboField
                label="받는 나라"
                ariaLabel="받는 나라"
                listId="recipient-country-list"
                options={countryOptions}
                value={form.country}
                onChange={set("country")}
                maxLength={LIMITS.country}
              />
              <TextField
                label="받는 기관 (기관·사람 중 하나는 꼭)"
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
              <ComboField
                label="받는 사람 직함"
                ariaLabel="받는 사람 직함"
                listId="recipient-title-list"
                options={TITLES}
                value={form.recipientTitle}
                onChange={set("recipientTitle")}
                maxLength={LIMITS.recipientTitle}
              />

              {COUNTRIES.includes(form.country.trim()) &&
              form.country.trim() !== "대한민국" ? (
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={loadOfficials}
                      disabled={officialsLoading}
                      className="h-10 rounded-xl border-2 border-accent px-4 text-base font-extrabold text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      {officialsLoading
                        ? "검색 중이에요…"
                        : `${form.country.trim()} 장관 이름 미리 보기`}
                    </button>
                    <span className="text-xs font-bold text-foreground/60">
                      웹 검색 결과(참고용)예요. 공식 사이트에서 꼭 확인해
                      주세요.
                    </span>
                  </div>
                  {officialsError ? (
                    <p
                      role="alert"
                      className="text-sm font-extrabold text-red-600"
                    >
                      {officialsError}
                    </p>
                  ) : null}
                  {officials.length > 0 &&
                  officialsFor === form.country.trim() ? (
                    <ul className="flex flex-col gap-2">
                      {officials.map((o) => (
                        <li
                          key={`${o.name}-${o.title}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-foreground/15 p-3"
                        >
                          <span className="text-base font-extrabold">
                            {o.title} · {o.name}
                            <span className="ml-2 text-sm font-bold text-foreground/60">
                              {o.organization}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <a
                              href={o.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-accent underline"
                            >
                              출처
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  recipientName: o.name,
                                  recipientTitle: o.title,
                                  recipientOrg:
                                    prev.recipientOrg || o.organization,
                                }))
                              }
                              className="h-9 rounded-xl bg-accent px-3 text-sm font-extrabold text-accent-foreground"
                            >
                              받는 사람으로 쓰기
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {extras.map((r, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border-2 border-foreground/15 p-4 sm:col-span-2 sm:grid-cols-2"
                >
                  <div className="flex items-center justify-between sm:col-span-2">
                    <span className="text-base font-extrabold">
                      받는 곳 {index + 2}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExtras((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="h-9 rounded-xl border-2 border-foreground/30 px-3 text-sm font-extrabold transition hover:bg-foreground/10"
                    >
                      삭제
                    </button>
                  </div>
                  {(
                    [
                      ["country", "받는 나라"],
                      ["org", "받는 기관"],
                      ["name", "받는 사람"],
                      ["title", "받는 사람 직함"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex flex-col gap-1.5">
                      <span className="text-sm font-extrabold">{label}</span>
                      <input
                        type="text"
                        value={r[key]}
                        maxLength={100}
                        autoComplete="off"
                        list={
                          key === "country"
                            ? "recipient-country-list"
                            : key === "title"
                              ? "recipient-title-list"
                              : undefined
                        }
                        onChange={(event) =>
                          setExtras((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, [key]: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={FIELD_CLASS}
                      />
                    </label>
                  ))}
                </div>
              ))}
              {fieldError("extras") ? (
                <p
                  role="alert"
                  className="text-sm font-extrabold text-red-600 sm:col-span-2"
                >
                  {fieldError("extras")}
                </p>
              ) : null}

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
                  <div className="flex flex-col gap-1">
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
                    <span className="text-xs font-bold text-foreground/60">
                      국가
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      aria-label="장소 도시"
                      list="place-city-list"
                      value={form.placeCity}
                      maxLength={LIMITS.place}
                      onChange={(event) => set("placeCity")(event.target.value)}
                      className={FIELD_CLASS}
                    />
                    <span className="text-xs font-bold text-foreground/60">
                      도시
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      aria-label="세부 장소"
                      value={form.placeDetail}
                      maxLength={LIMITS.place}
                      onChange={(event) => set("placeDetail")(event.target.value)}
                      className={FIELD_CLASS}
                    />
                    <span className="text-xs font-bold text-foreground/60">
                      세부 장소
                    </span>
                  </div>
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
            {countryOptions.map((name) => (
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
            className="h-14 rounded-2xl bg-accent text-xl font-extrabold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "AI가 공문을 만드는 중이에요…" : "AI로 공문 만들기"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty}
            className="h-12 rounded-xl border-2 border-foreground/30 text-base font-extrabold transition hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            임시저장
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
              AI가 입력한 내용으로 공문을 만들고 있어요. 보통 10초 안팎이
              걸려요.
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

          {results.length > 1 && !loading ? (
            <div role="tablist" className="flex flex-wrap gap-2">
              {results.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={active === index}
                  onClick={() => setActive(index)}
                  className={`h-11 rounded-xl border-2 px-4 text-base font-extrabold transition ${
                    active === index
                      ? "border-foreground/20 bg-foreground/15"
                      : "border-foreground/30 hover:bg-foreground/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          {failedLabels.length > 0 && !loading ? (
            <div
              role="alert"
              className="rounded-2xl border-2 border-red-500/60 bg-red-500/10 p-4 text-base font-extrabold"
            >
              {failedLabels.join(", ")} 공문은 만들지 못했어요. 다시 눌러
              주세요.
            </div>
          ) : null}

          {result && !loading ? (
            <LetterResult
              key={`${generatedFor}-${active}`}
              result={result}
              language={generatedLanguage}
            />
          ) : null}

          {!result && !loading ? (
            <div className="flex flex-col gap-4 rounded-2xl border-2 border-foreground/15 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="shrink-0 text-lg font-extrabold">입력 내용 요약</h2>
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-extrabold text-accent">
                  AI가 공문으로 만들어요
                </span>
              </div>
              {summary.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-foreground/25 p-6 text-center text-base text-foreground/60">
                  선택하고 입력하면 이곳에 내용이 모여요.
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
                적었다면{" "}
                <span className="font-extrabold">AI로 공문 만들기</span>를 눌러
                주세요.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
