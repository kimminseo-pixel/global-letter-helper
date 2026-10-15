// Design Ref: §1.1 메인 화면 — 입력 영역과 결과 영역. 상호작용은 LetterForm(클라이언트)이 맡는다.
import type { Metadata } from "next";
import Link from "next/link";

import LetterForm from "@/components/LetterForm";
import Notice from "@/components/Notice";

export const metadata: Metadata = {
  title: "공문 작성하기 · 글로벌 공문 도우미",
};

export default function WritePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          공문 작성하기
        </h1>
        <Link
          href="/"
          className="rounded-xl border-2 border-foreground/30 px-5 py-2 text-base font-extrabold transition hover:bg-foreground/10"
        >
          홈으로
        </Link>
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
