// Design Ref: §1 화면 구성 — 시작 화면. "서한 작성하기"로 작성 화면(/write)에 들어간다.
// 구성: 큰 한 줄 메시지(이미지 위) → 한 번에 하나씩 전하는 안내 블록 → 이용 안내. 말투는 "~해요" 체로 쓴다.
import Link from "next/link";

import HeroPhoto from "@/components/HeroPhoto";
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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
      {/* 왼쪽: 한 줄 메시지와 큰 버튼, 오른쪽: 공문이 써지는 움직이는 그림 */}
      <section className="grid items-stretch gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 rounded-[28px] bg-[rgba(7,25,76,0.05)] p-6 sm:p-10">
          <h1 className="break-keep text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            외국에 보낼 공식 서한
            <br />
            <span className="whitespace-nowrap">격식에 맞게 한 번에</span>
          </h1>
          <p className="break-keep text-lg font-bold leading-8 text-foreground/80 sm:text-xl">
            언어, 문체, 대상, 내용만 고르고 적으면 정부기관·기업에 보내는 공식
            서한을 영어·중국어·일본어 초안으로 만들어 드려요. 한국어 확인본으로
            내용도 바로 확인할 수 있어요!
          </p>
          <div>
            <Link
              href="/write"
              className="inline-flex h-14 items-center justify-center whitespace-nowrap rounded-2xl bg-accent px-8 text-xl font-extrabold text-accent-foreground shadow-xl transition hover:scale-105 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:h-20 sm:rounded-3xl sm:px-14 sm:text-3xl"
            >
              서한 작성하기
            </Link>
          </div>
        </div>

        <HeroPhoto />
      </section>

      {/* 한 줄에 세 가지 메시지, 그 아래 이용 안내까지 한 화면에 보이게 배치 */}
      <section aria-label="서비스 소개" className="grid gap-4 md:grid-cols-3">
        {MESSAGES.map((message, index) => (
          <div
            key={message.title}
            className="flex flex-col gap-2 rounded-[24px] bg-[rgba(7,25,76,0.05)] p-5 sm:p-6 lg:gap-1 lg:p-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base font-extrabold text-accent-foreground">
              {index + 1}
            </span>
            <h2 className="break-keep text-xl font-extrabold leading-snug tracking-tight lg:text-lg">
              {message.title}
            </h2>
            <p className="break-keep text-base font-bold leading-7 text-foreground/70 lg:text-sm lg:leading-6">
              {message.body}
            </p>
          </div>
        ))}
      </section>

      <section id="guide" aria-label="이용 안내" className="scroll-mt-24">
        <Notice />
      </section>
    </main>
  );
}
