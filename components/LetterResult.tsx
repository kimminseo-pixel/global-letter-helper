"use client";

// Design Ref: §1.1 결과 영역, §2.3 응답 — 초안(수정 가능·복사), 한국어 확인본, 검토 포인트, 빠진 항목 제안.
// 사용자 입력과 AI 출력은 텍스트로만 그린다(HTML로 삽입하지 않음).
import { useState } from "react";

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

export default function LetterResult({ result }: { result: LetterResponse }) {
  const [draft, setDraft] = useState(result.draft);
  const [copied, setCopied] = useState(false);
  // 빈칸은 [ ]뿐 아니라 [발신 기관명]처럼 이름이 붙은 대괄호도 함께 센다.
  const blanks = (draft.match(/\[[^\]\n]{0,30}\]/g) ?? []).length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      window.alert("복사하지 못했습니다. 초안을 직접 선택해 복사해 주세요.");
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

      <Section title="외국어 초안 (직접 수정할 수 있습니다)">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={14}
          aria-label="외국어 공문 초안"
          className="w-full rounded-xl border-2 border-foreground/30 bg-background px-4 py-3 text-base leading-7 focus-visible:border-accent focus-visible:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            {blanks > 0
              ? `비어 있는 [ ]가 ${blanks}곳 있습니다. 아래 "빠진 항목 제안"을 확인해 채워 주세요.`
              : "입력하지 않은 항목은 초안에서 생략했습니다."}
          </p>
          <button
            type="button"
            onClick={copy}
            className="h-12 rounded-full bg-accent px-7 text-base font-extrabold text-accent-foreground transition hover:opacity-90"
          >
            {copied ? "복사됨 ✓" : "초안 복사"}
          </button>
        </div>
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
    </div>
  );
}
