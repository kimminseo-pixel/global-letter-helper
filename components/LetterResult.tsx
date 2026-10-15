"use client";

// Design Ref: §1.1 결과 영역, §2.3 응답 — 초안(수정 가능·복사), 한국어 확인본, 검토 포인트, 빠진 항목 제안.
// 사용자 입력과 AI 출력은 텍스트로만 그린다(HTML로 삽입하지 않음).
import { useRef, useState } from "react";

import {
  buildDocx,
  buildHwpx,
  safeFileName,
  safeHwpxName,
} from "@/lib/letter/export-docx";
import type { LetterResponse } from "@/lib/letter/schema";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border-2 border-foreground/15 p-5">
      <h3 className="text-lg font-extrabold">{title}</h3>
      {children}
    </section>
  );
}

/** 언어별 공문 관례에 맞춰 제목을 내용에 끼워 넣어 한 번에 복사할 전체 문서를 만든다. */
function composeFull(language: string, subject: string, draft: string): string {
  const title = subject.trim();
  if (title === "") return draft;
  const lines = draft.split("\n");
  const insertAt = (pattern: RegExp, text: string): string => {
    const index = lines.findIndex((line) => pattern.test(line));
    if (index < 0) return `${text}\n\n${draft}`;
    return [...lines.slice(0, index), text, "", ...lines.slice(index)].join("\n");
  };
  if (language === "en") {
    // 영어: 호칭(Dear …) 바로 위에 Subject 줄
    return insertAt(/^\s*(Dear|To Whom|Gentlemen|Ladies)/i, `Subject: ${title}`);
  }
  if (language === "ja") {
    // 일본어: 宛名·発信者名 다음, 頭語 바로 위에 件名
    return insertAt(/^\s*(拝啓|謹啓|前略|冠省|拝復)/, `件名：${title}`);
  }
  // 중국어: 标题가 맨 위
  return `${title}\n\n${draft}`;
}

export default function LetterResult({
  result,
  language,
}: {
  result: LetterResponse;
  language: string;
}) {
  const [subject, setSubject] = useState(result.subject);
  const [draft, setDraft] = useState(result.draft);
  const [copied, setCopied] = useState<"all" | "subject" | "draft" | null>(null);
  const [showCopyWarning, setShowCopyWarning] = useState(false);
  const warningTimer = useRef<number | null>(null);
  // 빈칸은 [ ]뿐 아니라 [발신 기관명]처럼 이름이 붙은 대괄호도 함께 센다.
  const blanks = (draft.match(/\[[^\]\n]{0,30}\]/g) ?? []).length;

  async function copy(kind: "all" | "subject" | "draft") {
    const text =
      kind === "all"
        ? composeFull(language, subject, draft)
        : kind === "subject"
          ? subject
          : draft;
    // 복사하면 AI 초안이라는 점과 발송 전 확인을 빨간 경고로 알린다.
    setShowCopyWarning(true);
    if (warningTimer.current !== null) window.clearTimeout(warningTimer.current);
    warningTimer.current = window.setTimeout(
      () => setShowCopyWarning(false),
      12000,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
      window.alert("복사하지 못했습니다. 글을 직접 선택해 복사해 주세요.");
    }
  }

  /** Word(.docx) 또는 한글(.hwpx) 파일로 저장한다. */
  async function saveFile(kind: "word" | "hwp") {
    setShowCopyWarning(true);
    if (warningTimer.current !== null) window.clearTimeout(warningTimer.current);
    warningTimer.current = window.setTimeout(
      () => setShowCopyWarning(false),
      12000,
    );
    try {
      const text = composeFull(language, subject, draft);
      const blob =
        kind === "word"
          ? await buildDocx(language, text)
          : await buildHwpx(text, subject);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        kind === "word" ? safeFileName(subject) : safeHwpxName(subject);
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("파일을 만들지 못했습니다. 복사해서 붙여 넣어 주세요.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {result.warnings.length > 0 ? (
        <div
          role="status"
          className="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-5"
        >
          <p className="text-base font-extrabold">확인해 주세요</p>
          <ul className="mt-1 list-disc pl-5 text-base">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Section title="제목">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            aria-label="공문 제목"
            className="h-12 min-w-0 flex-1 rounded-xl border-2 border-foreground/30 bg-background px-4 text-base focus-visible:border-accent focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => copy("subject")}
            className="h-12 rounded-xl border-2 border-foreground/30 px-5 text-base font-extrabold transition hover:bg-foreground/10"
          >
            {copied === "subject" ? "복사됨 ✓" : "제목 복사"}
          </button>
        </div>
      </Section>

      <Section title="초안 내용 (직접 수정할 수 있습니다)">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={14}
          aria-label="외국어 공문 초안 내용"
          className="w-full rounded-xl border-2 border-foreground/30 bg-background px-4 py-3 text-base leading-7 focus-visible:border-accent focus-visible:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            {blanks > 0
              ? `비어 있는 [ ]가 ${blanks}곳 있습니다. 아래 "빠진 항목 제안"을 확인해 채워 주세요.`
              : "입력하지 않은 항목은 초안에서 생략했습니다."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy("draft")}
              className="h-12 rounded-xl border-2 border-foreground/30 px-5 text-base font-extrabold transition hover:bg-foreground/10"
            >
              {copied === "draft" ? "복사됨 ✓" : "내용 복사"}
            </button>
            <button
              type="button"
              onClick={() => copy("all")}
              className="h-12 rounded-xl bg-accent px-7 text-base font-extrabold text-accent-foreground transition hover:opacity-90"
            >
              {copied === "all" ? "복사됨 ✓" : "제목 포함 전체 복사"}
            </button>
            <button
              type="button"
              onClick={() => saveFile("word")}
              className="h-12 rounded-xl border-2 border-accent px-5 text-base font-extrabold text-accent transition hover:bg-accent/10"
            >
              Word로 저장 (.docx)
            </button>
            <button
              type="button"
              onClick={() => saveFile("hwp")}
              className="h-12 rounded-xl border-2 border-accent px-5 text-base font-extrabold text-accent transition hover:bg-accent/10"
            >
              한글로 저장 (.hwpx)
            </button>
          </div>
        </div>
        {showCopyWarning ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border-2 border-red-600 bg-red-600/10 p-4 text-base font-extrabold text-red-700 dark:text-red-400"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ⚠
            </span>
            <span>AI가 만든 초안이에요. 보내기 전에 꼭 확인해 주세요.</span>
          </div>
        ) : null}
      </Section>

      <Section title="한국어 확인본">
        <p className="text-sm text-foreground/70">
          AI가 만든 원래 초안 기준입니다. 위에서 초안을 수정해도 이 확인본은
          바뀌지 않습니다.
        </p>
        <p className="whitespace-pre-wrap text-base leading-7">
          {result.koreanVersion}
        </p>
      </Section>

      <Section title="검토 포인트 (호칭·격식을 고른 이유)">
        {result.reviewPoints.length > 0 ? (
          <ul className="list-disc pl-5 text-base leading-7">
            {result.reviewPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : (
          <p className="text-base">표시할 검토 포인트가 없습니다.</p>
        )}
        {result.uncertain.length > 0 ? (
          <div className="mt-2">
            <p className="text-base font-extrabold">확인 필요</p>
            <ul className="list-disc pl-5 text-base leading-7">
              {result.uncertain.map((item) => (
                <li key={`${item.phrase}-${item.reason}`}>
                  <span className="font-extrabold">{item.phrase}</span> —{" "}
                  {item.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      {result.missingItems.length > 0 ? (
        <Section title="빠진 항목 제안">
          <ul className="list-disc pl-5 text-base leading-7">
            {result.missingItems.map((item) => (
              <li key={`${item.label}-${item.suggestion}`}>
                <span className="font-extrabold">{item.label}</span> —{" "}
                {item.suggestion}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="유의사항">
        <ul className="list-disc pl-5 text-base leading-7">
          <li>
            이름·기관명·직함·장소 같은 고유명사는 철자와 표기가 맞는지 한 번 더
            확인해 주세요.
          </li>
          <li>날짜·시간·금액 등 숫자도 입력한 내용과 같은지 확인해 주세요.</li>
          <li>AI가 만든 초안이므로 보내기 전에 꼭 담당자가 검토해 주세요.</li>
        </ul>
      </Section>
    </div>
  );
}
