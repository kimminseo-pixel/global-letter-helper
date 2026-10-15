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
            외국에 보낼 공문
            <br />
            격식에 맞게 한 번에
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

        {/* 손으로 쓰며 고민하던 모습이 온라인으로 편하게 쓰는 모습으로 천천히 바뀐다(CSS 애니메이션). */}
        <figure className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl shadow-2xl">
          <Image
            src="/hero-office-before.jpg"
            alt="해외로 보낼 공문을 손으로 쓰며 고민하는 젊은 한국인 여성 직장인"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <Image
            src="/hero-office-after.jpg"
            alt="같은 직장인이 웹사이트에서 공문을 편하게 작성하며 미소 짓는 모습"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="hero-after object-cover"
          />
          <figcaption className="absolute bottom-4 left-4 flex">
            <span className="hero-label-before rounded-full bg-black/70 px-4 py-2 text-base font-extrabold text-white">
              손으로 쓰던 공문
            </span>
            <span className="hero-after hero-label-after absolute bottom-0 left-0 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-base font-extrabold text-accent-foreground">
              이제는 온라인으로 간편하게
            </span>
          </figcaption>
        </figure>
      </section>

      <Notice />
    </main>
  );
}
