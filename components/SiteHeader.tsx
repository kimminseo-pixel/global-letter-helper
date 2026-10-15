// 모든 화면 위쪽에 붙는 안내 줄과 메뉴. 공공기관 누리집처럼 "안내 줄 → 서비스 이름·메뉴" 순서로 구성한다.
import Image from "next/image";
import Link from "next/link";

const MENUS = [
  { href: "/", label: "홈" },
  { href: "/write", label: "공문 작성하기" },
  { href: "/#guide", label: "이용 안내" },
] as const;

export default function SiteHeader() {
  return (
    <header>
      <div className="bg-[#0b2a5b] px-4 py-1.5 text-center text-xs font-bold text-white sm:px-6">
        AI 공문 초안 작성 도우미입니다. 발송 전 확인과 최종 판단은 담당자가
        합니다.
      </div>
      <div className="border-b-2 border-foreground/10 bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt=""
              width={56}
              height={56}
              priority
              className="h-14 w-14 rounded-2xl"
            />
            <span className="text-2xl font-extrabold tracking-tight text-accent sm:text-4xl">
              글로벌 공문 도우미
            </span>
          </Link>
          <nav aria-label="주요 메뉴">
            <ul className="flex flex-wrap items-center gap-1">
              {MENUS.map((menu) => (
                <li key={menu.href}>
                  <Link
                    href={menu.href}
                    className="rounded-full px-4 py-2 text-base font-extrabold transition hover:bg-foreground/10"
                  >
                    {menu.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
