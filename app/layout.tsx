import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 신뢰감 있는 고딕체(본문·제목 공통). 한글 글자 모양은 필요한 만큼만 내려받는다. */
const sans = Noto_Sans_KR({
  weight: ["400", "500", "700", "800"],
  variable: "--font-sans-kr",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "글로벌 공문 도우미",
  description:
    "수신처와 목적을 한국어로 입력하면 격식에 맞는 외국어 공문 초안과 한국어 확인본을 만들어 드립니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
