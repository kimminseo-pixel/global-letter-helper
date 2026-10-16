"use client";

// 머리글 가운데 입력창: 요청 사항을 한 줄로 적고 누르면 서한 작성 화면의 "요청 사항" 칸에 채워 준다.
// 입력값은 주소(URL)에 싣지 않고 이 탭의 sessionStorage로만 넘긴다(주소 기록·서버 로그에 남지 않게).
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export const PREFILL_KEY = "gongmun-prefill";
export const PREFILL_EVENT = "gongmun:prefill";

export default function HeaderQuickStart() {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const purpose = text.trim().slice(0, 200);
    setText("");
    if (pathname === "/write") {
      // 이미 작성 화면이면 화면을 옮기지 않고 바로 채운다.
      window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail: purpose }));
      return;
    }
    try {
      if (purpose !== "") window.sessionStorage.setItem(PREFILL_KEY, purpose);
    } catch {
      /* 저장소를 쓸 수 없으면 빈 작성 화면으로 이동한다 */
    }
    router.push("/write");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="서한 빠르게 시작하기"
      className="flex w-full min-w-0 items-center gap-2 sm:flex-1"
    >
      <input
        type="text"
        value={text}
        maxLength={200}
        onChange={(event) => setText(event.target.value)}
        placeholder="어떤 서한이 필요하세요?"
        aria-label="요청 사항 한 줄"
        className="h-11 min-w-0 flex-1 rounded-full border-2 border-foreground/20 bg-background px-4 text-sm font-bold placeholder:text-foreground/45 focus-visible:border-accent focus-visible:outline-none sm:h-12 sm:px-5 sm:text-base"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-extrabold text-accent-foreground transition hover:opacity-90 sm:h-12 sm:px-5 sm:text-base"
      >
        서한 작성하기
      </button>
    </form>
  );
}
