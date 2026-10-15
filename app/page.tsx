// Design Ref: §1 화면 구성 — 시작 화면. "공문 작성하기"로 작성 화면(/write)에 들어간다.
// 구성: 큰 한 줄 메시지(이미지 위) → 한 번에 하나씩 전하는 안내 블록 → 이용 안내. 말투는 "~해요" 체로 쓴다.
import Image from "next/image";
import Link from "next/link";

import Notice from "@/components/Notice";

/** 한 블록에 메시지 하나씩: 굵은 제목 + 짧은 설명 */
const MESSAGES = [
  {
    title: "고르기만 하면 돼요",
    body: "언어와 문체, 받는 기관을 누르면 호칭과 어조는 알아서 맞춰요.",
  },
  {
    title: "단어만 적어도 문장이 돼요",
    body: "요청 사항과 일시, 장소를 짧게 적으면 격식 있는 문장으로 풀어 써요.",
  },
  {
    title: "한국어로 한 번 더 확인해요",
    body: "같은 내용을 한국어로 보여 드리고, 확인이 필요한 표현은 따로 알려 드려요.",
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-4 py-6 sm:px-6 sm:py-10">
      {/* 큰 이미지 위에 짧은 메시지 한 덩어리 */}
      <section className="flex flex-col gap-8">
        <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] shadow-2xl sm:aspect-[16/9]">
          <Image
            src="/hero-office-before.jpg"
            alt="해외로 보낼 공문을 손으로 쓰며 고민하는 젊은 한국인 여성 직장인"
            fill
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
          />
          <Image
            src="/hero-office-after.jpg"
            alt="같은 직장인이 웹사이트에서 공문을 편하게 작성하며 미소 짓는 모습"
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="hero-after object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 pb-28 sm:p-12 sm:pb-36">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              외국에 보낼 공문
              <br />
              <span className="whitespace-nowrap">격식에 맞게 한 번에</span>
            </h1>
            <div className="relative h-10">
              <span className="hero-label-before absolute left-0 top-0 rounded-full bg-white/20 px-4 py-2 text-base font-extrabold text-white backdrop-blur">
                손으로 쓰던 공문
              </span>
              <span className="hero-after hero-label-after absolute left-0 top-0 whitespace-nowrap rounded-full bg-white/20 px-4 py-2 text-base font-extrabold text-white backdrop-blur">
                이제는 온라인으로 간편하게
              </span>
            </div>
          </div>
          <Link
            href="/write"
            className="absolute bottom-5 right-5 inline-flex h-16 items-center justify-center whitespace-nowrap rounded-full bg-accent px-10 text-2xl font-extrabold text-accent-foreground shadow-2xl transition hover:scale-105 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:bottom-10 sm:right-10 sm:h-20 sm:px-14 sm:text-3xl"
          >
            공문 작성하기
          </Link>
        </figure>

        <div className="flex flex-col items-start gap-5">
          <p className="max-w-2xl text-lg font-bold leading-8 text-foreground/80 sm:text-xl">
            언어, 문체, 대상, 내용만 고르고 적으면 영어·중국어·일본어 공문
            초안과 한국어 확인본을 만들어 드려요.
          </p>
        </div>
      </section>

      {/* 한 블록에 메시지 하나 */}
      <section aria-label="서비스 소개" className="flex flex-col gap-6">
        {MESSAGES.map((message) => (
          <div
            key={message.title}
            className="reveal flex flex-col gap-3 rounded-[28px] bg-[rgba(7,25,76,0.05)] px-6 py-10 sm:px-12 sm:py-14"
          >
            <h2 className="break-keep text-3xl font-extrabold leading-snug tracking-tight sm:text-5xl">
              {message.title}
            </h2>
            <p className="max-w-2xl break-keep text-lg font-bold leading-8 text-foreground/70 sm:text-xl">
              {message.body}
            </p>
          </div>
        ))}
      </section>

      <section
        id="guide"
        aria-labelledby="guide-title"
        className="flex min-h-[70vh] scroll-mt-24 flex-col gap-4"
      >
        <h2
          id="guide-title"
          className="border-b-2 border-foreground/15 pb-2 text-2xl font-extrabold tracking-tight"
        >
          이용 안내
        </h2>
        <Notice />
      </section>
    </main>
  );
}
