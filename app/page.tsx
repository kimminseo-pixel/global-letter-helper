// Design Ref: §1 화면 구성 — 시작 화면. "공문 작성하기"로 작성 화면(/write)에 들어간다.
import Image from "next/image";
import Link from "next/link";

import Notice from "@/components/Notice";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="text-base font-extrabold tracking-wide text-accent">
            글로벌 공문 도우미
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            외국에 보낼 공문,
            <br />
            격식에 맞게 한 번에.
          </h1>
          <p className="text-lg font-bold leading-8 text-foreground/80">
            언어, 문체, 대상, 내용만 고르고 적으면 영어·중국어·일본어 공문
            초안과 한국어 확인본을 만들어 드립니다. 발송 전 확인과 최종 판단은
            담당자가 합니다.
          </p>
          <div>
            <Link
              href="/write"
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-9 text-xl font-extrabold text-accent-foreground shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              공문 작성하기
            </Link>
          </div>
        </div>

        <Image
          src="/hero.svg"
          alt="푸른 지구본 앞에서 인장이 찍힌 공문이 해외로 전달되는 그림"
          width={800}
          height={520}
          priority
          className="h-auto w-full rounded-3xl shadow-2xl"
        />
      </section>

      <Notice />
    </main>
  );
}
