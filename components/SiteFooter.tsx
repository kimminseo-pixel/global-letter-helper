// 모든 화면 아래쪽 안내. 서비스의 성격과 입력 정보 취급을 짧게 알린다.
export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t-2 border-foreground/10 bg-foreground/5">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-6 text-sm font-bold text-foreground/70 sm:px-6">
        <p>글로벌 공문 도우미는 외국에 보내는 공문의 초안 작성을 돕는 서비스입니다.</p>
        <p>입력한 내용은 저장하지 않으며, 초안 생성을 위해 외부 AI 서비스로 전송됩니다.</p>
      </div>
    </footer>
  );
}
