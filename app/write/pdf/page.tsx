// PDF를 올려서 공문을 만드는 화면. 기존 직접 입력 화면(/write)은 그대로 둔다.
import type { Metadata } from "next";
import Link from "next/link";

import Notice from "@/components/Notice";
import PdfLetterForm from "@/components/PdfLetterForm";

export const metadata: Metadata = {
  title: "PDF로 서한 작성하기 · 글로벌 공문 도우미",
};

export default function WritePdfPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
          PDF로 서한 작성하기
        </h1>
        <Link
          href="/write"
          className="inline-flex h-11 items-center rounded-xl border-2 border-foreground/30 px-4 text-base sm:h-14 sm:px-8 sm:text-xl font-extrabold transition hover:bg-foreground/10"
        >
          직접 쓰기
        </Link>
      </header>
      <p className="text-base font-extrabold sm:text-lg">
        사업 계획서나 세미나 포스터 PDF를 올리고 언어·문체·대상을 고르면 AI가
        읽고 공문 초안을 만들어요.
      </p>
      <PdfLetterForm />
      <Notice />
    </main>
  );
}
