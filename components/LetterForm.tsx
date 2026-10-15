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
  recipientTypeNote: string;
  letterType: string;
  letterTypeNote: string;
  purpose: string;
  content: string;
  country: string;
  recipientOrg: string;
  recipientName: string;
  recipientTitle: string;
  senderOrg: string;
  senderName: string;
  year: string;
  date: string;
  placeCountry: string;
  placeCity: string;
  placeDetail: string;
};

const INITIAL: FormState = {
  language: DEFAULT_LANGUAGE,
  formality: DEFAULT_FORMALITY,
  recipientType: "",
  recipientTypeNote: "",
  letterType: DEFAULT_LETTER_TYPE,
  letterTypeNote: "",
  purpose: "",
  content: "",
  country: "",
  recipientOrg: "",
  recipientName: "",
  recipientTitle: "",
  senderOrg: "",
  senderName: "",
  year: String(new Date().getFullYear()),
  date: "",
  placeCountry: "",
  placeCity: "",
  placeDetail: "",
};


/** 받는 나라 선택지 (목록에 없으면 직접 입력할 수 있다) */
const COUNTRIES = [
  "대한민국", "미국", "중국", "일본", "영국", "독일", "프랑스", "캐나다", "호주", "뉴질랜드", "싱가포르",
  "베트남", "태국", "인도네시아", "말레이시아", "필리핀", "인도", "파키스탄", "방글라데시", "몽골", "카자흐스탄",
  "우즈베키스탄", "러시아", "튀르키예", "사우디아라비아", "아랍에미리트", "카타르", "이스라엘", "이집트", "남아프리카공화국", "나이지리아",
  "케냐", "에티오피아", "브라질", "멕시코", "아르헨티나", "칠레", "콜롬비아", "페루", "이탈리아", "스페인",
  "네덜란드", "벨기에", "스위스", "스웨덴", "노르웨이", "핀란드", "덴마크", "폴란드", "체코", "헝가리",
  "오스트리아", "그리스", "포르투갈", "대만", "홍콩", "스리랑카", "네팔", "캄보디아", "라오스", "미얀마",
];

/** 연도 선택지: 올해부터 5년 뒤까지 */
const YEARS = Array.from({ length: 6 }, (_, i) =>
  String(new Date().getFullYear() + i),
);

/** 장소에서 국가를 고르면 보여 줄 대표 도시 (목록에 없으면 직접 입력) */
const CITIES: Record<string, string[]> = {
  대한민국: ["서울", "부산", "인천", "대전", "대구", "광주", "제주", "수원", "성남", "고양"],
  미국: ["워싱턴 D.C.", "뉴욕", "로스앤젤레스", "샌프란시스코", "시카고", "휴스턴", "보스턴", "시애틀"],
  중국: ["베이징", "상하이", "광저우", "선전", "청두", "홍콩", "항저우"],
  일본: ["도쿄", "오사카", "나고야", "후쿠오카", "요코하마", "교토", "삿포로"],
  영국: ["런던", "맨체스터", "버밍엄", "에든버러"],
  독일: ["베를린", "프랑크푸르트", "뮌헨", "함부르크", "뒤셀도르프"],
  프랑스: ["파리", "리옹", "마르세유", "니스"],
  캐나다: ["오타와", "토론토", "밴쿠버", "몬트리올"],
  호주: ["캔버라", "시드니", "멜버른", "브리즈번"],
  싱가포르: ["싱가포르"],
  베트남: ["하노이", "호치민", "다낭"],
  인도: ["뉴델리", "뭄바이", "방갈로르", "첸나이"],
  아랍에미리트: ["두바이", "아부다비"],
  스위스: ["제네바", "취리히", "베른", "바젤"],
};

/** 받는 사람 직함 선택지 (목록에 없으면 직접 입력할 수 있다) */
const TITLES = [
  "장관", "차관", "대사", "총영사", "국장", "과장", "팀장", "담당관", "담당자",
  "사장", "대표이사", "부사장", "이사", "본부장", "부장", "차장", "교수", "총장", "사무총장", "회장",
  "Minister", "Ambassador", "Director-General", "Director", "Manager", "President", "CEO", "Professor",
];

/** 달력에서 고른 날짜(2026-11-12)를 공문에 쓰기 쉬운 한국어 표기로 바꾼다. */
function formatDate(date: string): string {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!d) return "";
  return `${d[1]}년 ${Number(d[2])}월 ${Number(d[3])}일`;
}

/** 연도를 바꾸면 이미 고른 날짜의 연도도 함께 맞춘다. */
function withYear(date: string, year: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${year}${date.slice(4)}` : date;
}

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
  example,
  listId,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  /** 입력 예시. 칸 안이 아니라 칸 오른쪽 아래에 작게 보여 준다. */
  example?: string;
  /** 선택지 목록(datalist) id. 칸을 눌러 고르거나 직접 입력할 수 있다. */
  listId?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-extrabold">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        list={listId}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
      />
      {example ? (
        <span className="text-right text-xs font-bold text-foreground/50">
          예: {example}
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

    // 달력·시간 칸은 하나의 일시 문장으로 합쳐 보낸다.
    const { year, date, placeCountry, placeCity, placeDetail, ...formWithoutParts } =
      form;
    void year;

    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // '기타'를 고르지 않은 경우의 직접 입력 칸 값은 보내지 않는다.
        body: JSON.stringify({
          ...formWithoutParts,
          dateTime: formatDate(date),
          place: [placeCountry, placeCity, placeDetail]
            .map((part) => part.trim())
            .filter((part) => part !== "")
            .join(", "),
          recipientTypeNote:
            form.recipientType === "other" ? form.recipientTypeNote : "",
          letterTypeNote:
            form.letterType === "other" ? form.letterTypeNote : "",
        }),
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
            example="11월 무역 포럼 참석 요청"
            error={fieldError("purpose")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="받는 기관"
              value={form.recipientOrg}
              onChange={set("recipientOrg")}
              maxLength={LIMITS.recipientOrg}
              error={fieldError("recipientOrg")}
            />
            <TextField
              label="받는 나라"
              value={form.country}
              onChange={set("country")}
              maxLength={LIMITS.country}
              listId="country-list"
              error={fieldError("country")}
            />
            <TextField
              label="받는 사람"
              value={form.recipientName}
              onChange={set("recipientName")}
              maxLength={LIMITS.recipientName}
              error={fieldError("recipientName")}
            />
            <TextField
              label="받는 사람 직함"
              value={form.recipientTitle}
              onChange={set("recipientTitle")}
              maxLength={LIMITS.recipientTitle}
              listId="title-list"
              error={fieldError("recipientTitle")}
            />

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-base font-extrabold">일시</span>
              <div className="grid grid-cols-2 gap-3">
                <select
                  aria-label="연도"
                  value={form.year}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      year: event.target.value,
                      date: withYear(prev.date, event.target.value),
                    }))
                  }
                  className="h-12 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>

                <div className="relative h-12">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none flex h-full items-center justify-between rounded-xl border-2 border-foreground/30 bg-background px-4 text-base"
                  >
                    <span className={form.date ? "" : "text-foreground/50"}>
                      {form.date
                        ? `${Number(form.date.slice(5, 7))}월 ${Number(form.date.slice(8, 10))}일`
                        : "달력에서 선택"}
                    </span>
                    <span>📅</span>
                  </div>
                  <input
                    type="date"
                    aria-label="날짜 선택 (달력)"
                    value={form.date}
                    min={`${form.year}-01-01`}
                    max={`${form.year}-12-31`}
                    onClick={(event) => {
                      try {
                        event.currentTarget.showPicker();
                      } catch {
                        // 달력을 직접 열 수 없는 브라우저에서는 기본 동작을 따른다.
                      }
                    }}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        date: event.target.value,
                        year: event.target.value
                          ? event.target.value.slice(0, 4)
                          : prev.year,
                      }))
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-base font-extrabold">장소</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  aria-label="장소 국가"
                  placeholder=""
                  list="country-list"
                  value={form.placeCountry}
                  maxLength={LIMITS.place}
                  onChange={(event) => set("placeCountry")(event.target.value)}
                  className="h-12 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
                />
                <input
                  type="text"
                  aria-label="장소 도시"
                  list={
                    CITIES[form.placeCountry.trim()]
                      ? `city-list-${form.placeCountry.trim()}`
                      : undefined
                  }
                  value={form.placeCity}
                  maxLength={LIMITS.place}
                  onChange={(event) => set("placeCity")(event.target.value)}
                  className="h-12 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
                />
                <input
                  type="text"
                  aria-label="세부 장소"
                  value={form.placeDetail}
                  maxLength={LIMITS.place}
                  onChange={(event) => set("placeDetail")(event.target.value)}
                  className="h-12 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
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

        <datalist id="country-list">
          {COUNTRIES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {Object.entries(CITIES).map(([country, cities]) => (
          <datalist key={country} id={`city-list-${country}`}>
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        ))}
        <datalist id="title-list">
          {TITLES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

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
      </section>
    </div>
  );
}
