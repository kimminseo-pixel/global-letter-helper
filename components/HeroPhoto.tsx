// 시작 화면의 사진: 손으로 공문을 쓰며 고민하는 장면 → 온라인으로 편하게 쓰는 장면이 주기적으로 바뀐다.
// 움직임을 줄이도록 설정한 사용자에게는 '이후' 장면만 보인다(globals.css).
import Image from "next/image";

export default function HeroPhoto() {
  return (
    <figure className="relative h-full min-h-[320px] w-full overflow-hidden rounded-[28px] shadow-xl">
      <Image
        src="/hero-office-before.jpg"
        alt="해외로 보낼 공문을 손으로 쓰며 고민하는 젊은 한국인 여성 직장인"
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover object-[50%_25%]"
      />
      <Image
        src="/hero-office-after.jpg"
        alt="같은 직장인이 웹사이트에서 공문을 편하게 작성하며 미소 짓는 모습"
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="hero-after object-cover object-[50%_25%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"
      />
      <div className="absolute bottom-4 left-4 h-10">
        <span className="hero-label-before absolute left-0 top-0 whitespace-nowrap rounded-xl bg-white/25 px-4 py-2 text-base font-extrabold text-white backdrop-blur">
          손으로 쓰던 공문
        </span>
        <span className="hero-after absolute left-0 top-0 whitespace-nowrap rounded-xl bg-white/25 px-4 py-2 text-base font-extrabold text-white backdrop-blur">
          이제는 온라인으로 간편하게
        </span>
      </div>
    </figure>
  );
}
