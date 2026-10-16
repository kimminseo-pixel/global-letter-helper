// Design Ref: §1.1 메인 화면 — 입력 영역과 결과 영역. 상호작용은 LetterForm(클라이언트)이 맡는다.
import type { Metadata } from "next";
import Link from "next/link";

import LetterForm from "@/components/LetterForm";
import Notice from "@/components/Notice";

export const metadata: Metadata = {
  title: "서한 작성하기 · 글로벌 공문 도우미",
};

export default function WritePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          서한 작성하기
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/write/pdf"
            className="inline-flex h-14 items-center rounded-xl bg-accent px-8 text-xl font-extrabold text-accent-foreground transition hover:opacity-90"
          >
            PDF로 만들기
          </Link>
          <Link
            href="/"
            className="inline-flex h-14 items-center rounded-xl border-2 border-foreground/30 px-8 text-xl font-extrabold transition hover:bg-foreground/10"
          >
            홈으로
          </Link>
        </div>
      </header>

      <p className="text-lg font-extrabold">
        왼쪽에서 언어·문체·대상을 고르고 내용을 적은 뒤 AI로 공문 만들기를
        눌러 주세요.
      </p>

      <LetterForm />

      <Notice />
    </main>
  );
}
