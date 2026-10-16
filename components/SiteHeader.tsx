// 모든 화면 위쪽에 붙는 머리글: 안내 줄 → 로고·빠른 시작 입력창 → 메뉴 줄(2단 간결형)
import Image from "next/image";
import Link from "next/link";

import HeaderQuickStart from "./HeaderQuickStart";
import HeaderTabs from "./HeaderTabs";

export default function SiteHeader() {
  return (
    <header className="border-b border-foreground/10 bg-background">
      <div className="bg-[#1d2b64] px-4 py-2 text-center text-xs font-extrabold text-white sm:px-6 sm:text-sm">
        AI가 만든 초안이에요. 보내기 전에 꼭 확인해 주세요.
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 pt-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:pt-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/logo.svg"
            alt=""
            width={48}
            height={48}
            priority
            className="h-10 w-10 rounded-xl sm:h-12 sm:w-12"
          />
          <span className="text-xl font-extrabold tracking-tight text-accent sm:text-3xl">
            글로벌 공문 도우미
          </span>
        </Link>
        <HeaderQuickStart />
      </div>
      <div className="mt-2 border-t border-foreground/10 sm:mt-3">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <HeaderTabs />
        </div>
      </div>
    </header>
  );
}
