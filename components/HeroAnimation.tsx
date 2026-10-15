// 시작 화면의 움직이는 그림(코드 애니메이션): 공문이 한 줄씩 써지고 완성되면 날아가는 모습을 반복해서 보여 준다.
// 움직임은 CSS만으로 만들고, 배경에만 사진(public/hero-network.webp)을 깐다. 움직임을 줄이도록 설정한 사용자에게는 완성된 모습으로 멈춰 있다.
import Image from "next/image";

const LANGUAGE_CHIPS = ["영어", "중국어", "일본어"] as const;

export default function HeroAnimation() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full min-h-[320px] w-full items-end justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1d2b64] via-[#17224f] to-[#0c1536] p-6 sm:p-8"
    >
      {/* 배경 사진: 지구와 연결선. 위에 남색을 덮어 카드 글자가 잘 보이게 하고, 아래쪽 사진 속 작은 글씨는 가린다. */}
      <Image
        src="/hero-network.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover object-top"
      />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0c1536] to-transparent" />

      {/* 공문 카드 */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white/95 p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          {LANGUAGE_CHIPS.map((label, index) => (
            <span
              key={label}
              className={`ha-chip ha-chip-${index + 1} rounded-full border border-[#1d2b64]/20 px-3 py-1 text-xs font-extrabold text-[#1d2b64]`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-extrabold text-[#1d2b64]/60">제목</span>
          <div className="h-3 flex-1 rounded-full bg-[#1d2b64]/10">
            <div className="ha-bar ha-subject h-full rounded-full bg-[#1d2b64]" />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#1d2b64]/10 pt-5">
          <div className="h-2.5 w-full rounded-full bg-[#1d2b64]/10">
            <div className="ha-bar ha-l1 h-full rounded-full bg-[#1d2b64]/70" />
          </div>
          <div className="h-2.5 w-11/12 rounded-full bg-[#1d2b64]/10">
            <div className="ha-bar ha-l2 h-full rounded-full bg-[#1d2b64]/70" />
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#1d2b64]/10">
            <div className="ha-bar ha-l3 h-full rounded-full bg-[#1d2b64]/70" />
          </div>
          <div className="h-2.5 w-7/12 rounded-full bg-[#1d2b64]/10">
            <div className="ha-bar ha-l4 h-full rounded-full bg-[#1d2b64]/70" />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="ha-working rounded-full bg-[#1d2b64] px-4 py-2 text-xs font-extrabold text-white">
            AI가 공문을 만들어요
          </span>
          <span className="ha-done rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white">
            ✓ 완성
          </span>
        </div>
      </div>

      {/* 완성된 공문이 날아가는 종이비행기 */}
      <svg
        className="ha-plane absolute left-1/2 top-1/2 h-10 w-10 text-[#7f93e0] drop-shadow"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M2 11.5 22 2l-6.5 20-4.3-7.2L2 11.5Zm9.2 3.3 2.2 3.7L17 7.2l-8.4 5.4 2.6 2.2Z" />
      </svg>
    </div>
  );
}
