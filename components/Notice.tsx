// Design Ref: §1.1 안내 문구 — 접어도 사라지지 않게 항상 표시하는 두 가지 안내 (PRD §7)
// Plan SC: 화면에 "대외비·기밀 내용은 입력하지 마세요", "입력 내용은 외부 AI 서비스로 전송됩니다"를 표시

const NOTICES = [
  "대외비·기밀 내용은 입력하지 마세요",
  "입력 내용은 외부 AI 서비스로 전송됩니다",
] as const;

export default function Notice() {
  return (
    <section
      aria-label="이용 전 안내"
      className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3"
    >
      <ul className="flex flex-col gap-1.5 text-sm font-medium">
        {NOTICES.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <span aria-hidden="true">⚠</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
