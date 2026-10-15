@AGENTS.md

# my-app — 글로벌 공문 도우미

외국 정부부처·협력업체에 보낼 공문 초안을 만들어 주는 웹 서비스. 담당자가 수신처·목적·핵심 내용을 한국어로 입력하면 격식에 맞는 외국어 초안과 한국어 확인본을 보여 준다. 기획 전문은 [PRD.md](PRD.md)를 따른다.

> 현재 상태: `create-next-app` 보일러플레이트 그대로다. `app/page.tsx`, `app/layout.tsx`의 메타데이터와 `lang="en"`은 아직 바꾸지 않았다.

## 기술 스택

- Next.js 16.4.1 (App Router) · React 19.3 · TypeScript 5 (`strict`)
- Tailwind CSS 4 — `@tailwindcss/turbopack` 로더를 `next.config.ts`에서 연결, 스타일은 `app/globals.css`
- ESLint 9 (`eslint-config-next`: core-web-vitals + typescript)
- 경로 별칭 `@/*` → 프로젝트 루트
- 배포: Vercel 예정

## 명령어

```bash
npm run dev     # 개발 서버 (Turbopack)
npm run build   # 프로덕션 빌드 — 타입 오류 확인에도 사용
npm run start   # 빌드 결과 실행
npm run lint    # ESLint
```

테스트 러너는 아직 없다. 변경 후에는 `npm run lint`와 `npm run build`로 확인한다.

## Next.js 주의사항

이 버전은 기존 Next.js와 다르다. 코드를 쓰기 전에 `node_modules/next/dist/docs/01-app/`의 해당 문서를 먼저 읽는다.

- **Cache Components 사용 중** (`cacheComponents: true`, `partialPrefetching: true`). 요청 시점 값(`cookies()`, `headers()` 등)을 읽는 UI는 `<Suspense>` 안에 둔다. 캐시는 `'use cache'` + `cacheLife`로 지정한다. → `01-getting-started/08-caching.md`
- **`middleware`는 deprecated, `proxy`로 이름이 바뀌었다.** 로그인 보호용 코드는 `proxy.ts`로 작성한다. → `03-api-reference/03-file-conventions/proxy.md`
- 로그인 구현 시 `02-guides/authentication.md`, `02-guides/authentication-with-cache-components.md`를 먼저 읽는다.
- 서버 전용 모듈에는 `import 'server-only'`를 붙인다.
- `layout`/`page`의 props 타입은 전역 `LayoutProps<"/">` 같은 헬퍼를 쓴다 (`app/layout.tsx` 참고).

## 디렉터리 구조

```
app/          App Router — layout.tsx, page.tsx, globals.css
public/       정적 파일
PRD.md        서비스 기획서 (기능 범위와 AI 규칙의 기준 문서)
AGENTS.md     Next.js 관련 경고 (next dev가 관리)
```

API(서버 쪽 코드)는 `app/api/**/route.ts`(Route Handler)로 만든다.

## 서비스 규칙 (PRD 요약)

### 만들 것
- 웹 화면 1개: 정보 입력 → 초안 + 한국어 확인본 + 검토 포인트
- 출력 언어: 영어·중국어·일본어 / 공문 종류: 협조 요청·회신·감사
- 수신처 구분(정부기관·기업·기타)과 격식 수준(일반 업무·공식·최고 격식)에 따른 어조 차이
- 회원가입·로그인(이메일·소속·비밀번호), 비밀번호 재설정(이메일 인증). 가입한 사용자만 사용

### 만들지 않을 것
이메일 등 자동 발송 · 공문 저장/불러오기 · 파일 첨부/출력(PDF·HWP·Word) · 법적·외교적 효력 판단 · 외교각서·조약 서식 · 음성 입력 · 모바일 앱

### 공문 생성 AI 규칙
- 입력된 수신처·발신 기관·담당자·목적·핵심 내용을 빠뜨리지 않는다.
- 입력에 없는 날짜·금액·이름·수치는 지어내지 않고 `[ ]`로 비운 뒤, 빠진 항목을 초안과 별도로 제안한다.
- 구조는 수신 → 제목 → 본문(인사, 목적, 요청 사항, 맺음) → 발신 순으로 고정한다.
- 구어체·줄임말(예: don't) 금지. 분량은 A4 한 장(영어 약 300단어) 이내.
- 한국어 확인본은 의미를 더하거나 빼지 않는다.
- 호칭·격식 선택 이유는 3줄 이내로 설명하고, 확신이 없는 표현은 "확인 필요"로 표시한다.
- 입력이 짧아도 초안은 만든다.

## 보안·개인정보

- **`.env`의 값은 채팅·로그·코드에 출력하지 않고 커밋하지 않는다.** 현재 `OPENAI_API_KEY`, `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`이 들어 있다. `.gitignore`의 `.env*`로 제외돼 있다. 외부 서비스 인증에 필요하면 값을 읽어서 쓰되(아래 "작업 규칙" 참고) 내용을 노출하지 않는다.
- API 키는 서버 코드에서만 `process.env`로 읽는다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- Vercel 배포 시 `.env`를 올리지 않고 Vercel 환경변수에 따로 등록한다.
- 비밀번호는 암호화해 저장하고 화면·로그에 남기지 않는다.
- 공문 입력 내용과 생성 결과는 저장하지 않는다 (저장 기능은 비범위).
- 화면에 두 가지 안내를 표시한다: "대외비·기밀 내용은 입력하지 마세요", "입력 내용은 외부 AI 서비스로 전송됩니다".
- 개발·테스트 중에는 실명·실제 연락처 대신 가상의 이름과 예시 정보만 쓴다.

## 코딩 규칙

- 서버 컴포넌트를 기본으로 하고, 상호작용이 필요한 부분에만 `'use client'`를 쓴다.
- 스타일은 Tailwind 유틸리티 클래스로 작성한다. 색상은 `globals.css`의 `--background`/`--foreground` 토큰을 쓴다.
- 사용자에게 보이는 문구는 한국어, 코드 식별자는 영어로 쓴다.
- `any`를 쓰지 않는다. `strict` 오류는 타입으로 해결한다.
- 새 기능은 PLAN.md의 작업 순서(1~16)를 따른다. PRD "개발 단위"(1~15)와의 번호 대응은 PLAN.md 표를 본다. 범위 밖 기능은 추가하기 전에 확인한다.
- 로그인 없이 쓰는 서비스로 결정했다(2026-10-15). 회원가입·로그인·비밀번호 재설정은 만들지 않으며 PRD·PLAN·DESIGN의 해당 항목(작업 12~14)은 보류다. 대신 새 Route Handler는 입력을 서버에서 zod 스키마로 다시 검증하고 호출 횟수를 제한한다(`lib/letter/rate-limit.ts`). 새 환경변수는 서버 전용(`NEXT_PUBLIC_` 금지)으로 둔다.
- 프롬프트·생성 로직을 바꾸면 날짜·직함을 일부러 비운 요청으로 실제 호출해, 입력에 없는 값이 `[ ]`로 비는지 확인하고 결과를 보고한다. (오늘 입력에 없는 날짜를 지어낸 사례가 있었다.)

## 작업 규칙

### 언어·위치
- 모든 설명과 주석은 한국어로 작성한다.
- 새 파일은 `my-app` 폴더 안에만 만든다.

### 기술 스택
- 기술 스택은 PRD에 정한 대로 Next.js로 고정한다. 다른 프레임워크로 바꾸거나 마이그레이션을 제안하지 않는다.
- 배포는 Vercel을 사용한다.

### 변경 보고·삭제
- 코드를 바꾸면 반드시 무엇을 왜 바꿨는지 한 줄로 알려 준다.
- 파일을 지워야 할 때는 바로 삭제하지 않는다. `trash-can` 폴더를 만들어 그 안으로 옮겨만 두고, 작업이 끝난 뒤 사용자가 직접 확인하고 삭제한다. `trash-can`은 `.gitignore`에 등록돼 있어 커밋되지 않는다.

### 비밀 정보·외부 서비스 인증
- `.env` 등 비밀 정보 파일과 `node_modules` 폴더는 `.gitignore`에 등록해 두고, 절대 커밋하지 않는다.
- 외부 서비스 인증이 필요하면 토큰 값을 사용자에게 묻거나 채팅에 출력하지 않는다. `.env`에 있는 값을 읽어서 사용한다.
  - Supabase: Supabase CLI를 설치해 `.env`의 `SUPABASE_ACCESS_TOKEN`으로 작업한다.
  - Vercel(배포 등): Vercel CLI를 설치해 `.env`의 `VERCEL_TOKEN`으로 인증해 작업한다.

### 커밋
- 커밋 메시지는 한국어로, 무엇을 왜 바꿨는지 한 줄로 적는다.
- 커밋하기 전에 `.env` 같은 비밀 값 파일이 커밋에 들어가지 않았는지 확인한다. (예: `git status`, `git diff --cached --name-only`)

### 서브에이전트
- 이미 설치된 서브에이전트는 필요할 때마다 적극 활용한다.

## 작업 절차 (검증 루프)

코드를 바꿀 때마다 아래 순서를 반복한다.

1. **변경한다.**
2. **`npm run lint`와 `npm run build`를 실행해 오류가 없는지 확인한다.**
3. **화면이 바뀐 작업이면 `npm run dev`로 띄워 실제로 보이는지 확인한다.**
4. **문제가 있으면 고치고 1번으로 돌아간다.**
5. **통과하면 git 커밋으로 그 상태를 남긴다.**
   - 커밋 메시지는 한국어로, 무엇을 왜 바꿨는지 한 줄로 적는다.
   - 검증을 통과하지 못한 상태는 커밋하지 않는다.
   - 커밋 전 비밀 값 파일이 포함되지 않았는지 확인한다 (위 "커밋" 규칙).
6. **무엇을 왜 바꿨는지 한 줄로 요약해 알려 준다.**

## 미정 사항 (확정되면 이 문서를 갱신)

- [x] 로그인·회원 정보 저장소 — Supabase Auth로 정했다 (DESIGN.md 3장). 프로젝트 생성과 `SUPABASE_URL`·`SUPABASE_ANON_KEY` 발급은 PLAN 작업 12에서 한다.
- [x] AI 호출 방식 — `openai` SDK로 정했다 (DESIGN.md 3장). 모델명은 `OPENAI_MODEL` 환경변수로 분리하고 PLAN 작업 2에서 확정한다.
- [x] 테스트 도구 — 별도 프레임워크 없이 `scripts/eval-letters.ts` 실행 스크립트로 20건을 생성하고 사람이 판정한다 (DESIGN.md 8장).
- [ ] DESIGN.md 10장의 "확인 필요" 항목 — PRD와 달라지는 점(필수 입력, 입력 항목 추가, 초안 수정, 가입 이메일 확인 끔 등)을 확정한다.
