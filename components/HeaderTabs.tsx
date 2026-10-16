"use client";

// 머리글 아래 메뉴 줄: 지금 있는 화면을 밑줄로 표시한다. 휴대폰에서는 옆으로 밀어 볼 수 있다.
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENUS = [
  { href: "/", label: "홈" },
  { href: "/write", label: "서한 작성하기" },
  { href: "/write/pdf", label: "PDF로 만들기" },
  { href: "/#guide", label: "이용 안내" },
] as const;

export default function HeaderTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="overflow-x-auto">
      <ul className="flex gap-6 whitespace-nowrap sm:gap-9">
        {MENUS.map((menu) => {
          const active = menu.href === pathname;
          return (
            <li key={menu.href}>
              <Link
                href={menu.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block border-b-[3px] py-2.5 text-base font-extrabold transition sm:py-3 sm:text-lg ${
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/65 hover:text-foreground"
                }`}
              >
                {menu.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
