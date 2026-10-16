// 모든 화면 위쪽에 붙는 안내 줄과 메뉴. 공공기관 누리집처럼 "안내 줄 → 서비스 이름·메뉴" 순서로 구성한다.
import Image from "next/image";
import Link from "next/link";

const MENUS = [
  { href: "/", label: "홈" },
  { href: "/write", label: "서한 작성하기" },
] as const;

export default function SiteHeader() {
  return (
    <header>
      <div className="bg-[#1d2b64] px-4 py-2 text-center text-xs font-extrabold text-white sm:px-6 sm:text-sm">
        AI가 만든 초안이에요. 보내기 전에 꼭 확인해 주세요.
      </div>
      <div className="bg-foreground/5">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt=""
              width={56}
              height={56}
              priority
              className="h-11 w-11 rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl"
            />
            <span className="text-xl font-extrabold tracking-tight text-accent sm:text-4xl">
              글로벌 공문 도우미
            </span>
          </Link>
          <nav aria-label="주요 메뉴">
            <ul className="flex flex-wrap items-center gap-1">
              {MENUS.map((menu) => (
                <li key={menu.href}>
                  <Link
                    href={menu.href}
                    className="rounded-full px-3 py-2 text-lg font-extrabold sm:px-6 sm:py-3 sm:text-3xl transition hover:bg-foreground/10"
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
