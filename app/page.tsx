// Design Ref: §1.1 메인 화면 — 상단 제목과 안내 문구. 입력 폼·결과 영역은 작업 8~10에서 추가한다.
import Notice from "@/components/Notice";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          글로벌 공문 도우미
        </h1>
        <p className="text-base leading-7 text-foreground/70">
          수신처와 목적을 한국어로 입력하면 격식에 맞는 외국어 공문 초안과
          한국어 확인본을 만들어 드립니다. 발송 전 확인과 최종 판단은 담당자가
          합니다.
        </p>
      </header>

      <Notice />

      <section
        aria-label="공문 만들기"
        className="rounded-lg border border-foreground/15 px-4 py-8 text-center text-sm text-foreground/60"
      >
        공문 정보 입력 화면을 준비하고 있습니다.
      </section>
    </main>
  );
}
