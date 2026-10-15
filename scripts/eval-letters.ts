// PLAN 작업 15 — 테스트 공문 20건 생성·기록 스크립트 (앱 기능이 아니라 평가용 도구)
// 사용: 개발 서버(npm run dev)를 켠 상태에서 `node scripts/eval-letters.ts [서버주소]`
// 평가용 가상 데이터만 쓰며, 결과는 eval-results/ 폴더에 마크다운으로 저장한다.
// 사람이 채울 열(판정 1·2, 격식·호칭 오류, 작성 시간)은 비워 둔다.
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
/** 서버의 호출 제한(1분 8회) 안에서 돌도록 요청 간 최소 간격 */
const MIN_INTERVAL_MS = 8_000;

type Case = {
  language: "en" | "zh" | "ja";
  chineseScript?: "simplified" | "traditional";
  formality: "general" | "formal" | "highest";
  recipientType: "government" | "company" | "other";
  recipientTypeNote?: string;
  letterType: "request" | "reply" | "thanks";
  purpose: string;
  country?: string;
  recipientOrg?: string;
  recipientName?: string;
  recipientTitle?: string;
  senderOrg?: string;
  senderName?: string;
  dateTime?: string;
  place?: string;
  content?: string;
  /** 일부러 항목을 비운 건인지(생략 처리 확인용) */
  sparse?: boolean;
};

// 언어 영어 10·중국어 5·일본어 5 / 협조 요청 8·회신 6·감사 6 / 정부기관 8·기업 8·기타 4 / 입력 일부 비움 5건
const CASES: Case[] = [
  { language: "en", formality: "formal", recipientType: "government", letterType: "request", purpose: "한-호주 무역협력회의 참석 요청", country: "호주", recipientOrg: "Department of Trade", recipientTitle: "국장", senderOrg: "한국무역협회", senderName: "홍길동", dateTime: "2026년 11월 20일", place: "호주, 시드니" },
  { language: "en", formality: "general", recipientType: "company", letterType: "request", purpose: "신제품 견적서 제출 요청", country: "미국", recipientOrg: "Acme Trading Inc.", recipientName: "John Miller", recipientTitle: "부장", senderOrg: "가나다상사", senderName: "김철수" },
  { language: "en", formality: "highest", recipientType: "government", letterType: "thanks", purpose: "지난 방한 시 환대에 대한 감사", country: "영국", recipientOrg: "Ministry of Industry", recipientTitle: "장관", senderOrg: "산업통상부", senderName: "이영희" },
  { language: "en", formality: "formal", recipientType: "company", letterType: "reply", purpose: "공동 개발 제안에 대한 긍정 회신, 다음 달 화상회의 제안", country: "캐나다", recipientOrg: "Northern Tech Ltd.", recipientName: "Emily Carter", senderOrg: "한빛전자" },
  { language: "en", formality: "general", recipientType: "other", recipientTypeNote: "국제기구", letterType: "request", purpose: "세미나 발표자 추천 요청", country: "스위스", recipientOrg: "International Standards Forum", senderOrg: "한국표준협회", sparse: true },
  { language: "en", formality: "highest", recipientType: "government", letterType: "reply", purpose: "초청장에 대한 참석 확정 회신", country: "싱가포르", recipientOrg: "Ministry of Trade and Industry", recipientTitle: "차관", senderOrg: "산업통상부", senderName: "박민준", dateTime: "2026년 12월 3일" },
  { language: "en", formality: "formal", recipientType: "company", letterType: "thanks", purpose: "전시회 기간 중 부스 지원에 대한 감사", country: "독일", recipientOrg: "Berlin Expo GmbH", recipientName: "Anna Schmidt", senderOrg: "다온테크", senderName: "최수진" },
  { language: "en", formality: "general", recipientType: "other", recipientTypeNote: "대학", letterType: "thanks", purpose: "특강 방문에 대한 감사", country: "미국", recipientOrg: "Westbridge University", recipientName: "Prof. David Lee", senderOrg: "서울글로벌센터" },
  { language: "en", formality: "formal", recipientType: "government", letterType: "request", purpose: "수출입 통관 절차 자료 협조 요청", country: "베트남", recipientOrg: "Ministry of Industry and Trade", recipientTitle: "과장", sparse: true },
  { language: "en", formality: "formal", recipientType: "company", letterType: "reply", purpose: "납기 지연 문의에 대한 회신, 2주 내 출고 예정", country: "일본", recipientOrg: "Sakura Components", recipientName: "Kenji Tanaka", senderOrg: "미래정밀", senderName: "정우성" },
  { language: "zh", chineseScript: "simplified", formality: "formal", recipientType: "government", letterType: "request", purpose: "韩中贸易合作研讨会参加 요청", country: "중국", recipientOrg: "商务部", recipientTitle: "司长", senderOrg: "한국무역협회", senderName: "홍길동", dateTime: "2026년 11월 25일", place: "중국, 베이징" },
  { language: "zh", chineseScript: "simplified", formality: "general", recipientType: "company", letterType: "reply", purpose: "샘플 발송 요청에 대한 회신, 다음 주 발송", country: "중국", recipientOrg: "上海明达贸易有限公司", recipientName: "王伟", senderOrg: "가나다상사" },
  { language: "zh", chineseScript: "traditional", formality: "formal", recipientType: "company", letterType: "thanks", purpose: "공장 견학 환대에 대한 감사", country: "대만", recipientOrg: "台北精密工業股份有限公司", recipientName: "陳先生", senderOrg: "한빛전자", senderName: "김철수" },
  { language: "zh", chineseScript: "simplified", formality: "highest", recipientType: "other", recipientTypeNote: "협회", letterType: "request", purpose: "한중 청년 교류 프로그램 협조 요청", country: "중국", recipientOrg: "中国青年交流协会", senderOrg: "한국청년재단", sparse: true },
  { language: "zh", chineseScript: "simplified", formality: "general", recipientType: "government", letterType: "thanks", purpose: "전시회 개최 지원에 대한 감사", country: "중국", recipientOrg: "广东省商务厅", recipientTitle: "처장", senderOrg: "산업통상부", senderName: "이영희" },
  { language: "ja", formality: "formal", recipientType: "company", letterType: "request", purpose: "신제품 설명회 참석 요청", country: "일본", recipientOrg: "株式会社ひかり商事", recipientName: "山田太郎", recipientTitle: "부장", senderOrg: "한국무역협회", senderName: "홍길동", dateTime: "2026년 12월 5일", place: "일본, 도쿄" },
  { language: "ja", formality: "highest", recipientType: "government", letterType: "reply", purpose: "국장급 회의 일정 제안에 대한 회신", country: "일본", recipientOrg: "経済産業省", recipientTitle: "국장", senderOrg: "산업통상부", senderName: "박민준" },
  { language: "ja", formality: "general", recipientType: "company", letterType: "thanks", purpose: "공장 견학 허락에 대한 감사", country: "일본", recipientOrg: "東洋機械株式会社", senderOrg: "미래정밀", sparse: true },
  { language: "ja", formality: "formal", recipientType: "other", recipientTypeNote: "대학", letterType: "request", purpose: "공동 연구 자료 제공 협조 요청", country: "일본", recipientOrg: "桜台大学", recipientName: "佐藤花子", senderOrg: "서울대학교 연구소", sparse: true },
  { language: "ja", formality: "formal", recipientType: "government", letterType: "request", purpose: "수출 규제 관련 설명 자료 제공 협조 요청", country: "일본", recipientOrg: "外務省", recipientTitle: "과장", senderOrg: "산업통상부", senderName: "최수진" },
];

type Outcome = {
  ok: boolean;
  seconds: number;
  subject: string;
  draft: string;
  koreanVersion: string;
  warnings: string[];
  uncertain: string[];
  missing: string[];
  error?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callApi(testCase: Case): Promise<Outcome> {
  const started = Date.now();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { sparse: _sparse, ...payload } = testCase;
      void _sparse;
      const response = await fetch(`${BASE}/api/letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 429) {
        await sleep(30_000);
        continue;
      }
      const body = (await response.json()) as Record<string, unknown>;
      const seconds = Math.round((Date.now() - started) / 100) / 10;
      if (!response.ok) {
        const error = body.error as { message?: string } | undefined;
        return { ok: false, seconds, subject: "", draft: "", koreanVersion: "", warnings: [], uncertain: [], missing: [], error: error?.message ?? `HTTP ${response.status}` };
      }
      const uncertain = (body.uncertain as { phrase: string; reason: string }[]).map((u) => `${u.phrase} — ${u.reason}`);
      const missing = (body.missingItems as { label: string; suggestion: string }[]).map((m) => `${m.label}: ${m.suggestion}`);
      return {
        ok: true,
        seconds,
        subject: String(body.subject),
        draft: String(body.draft),
        koreanVersion: String(body.koreanVersion),
        warnings: body.warnings as string[],
        uncertain,
        missing,
      };
    } catch (error) {
      if (attempt === 3) {
        return { ok: false, seconds: 0, subject: "", draft: "", koreanVersion: "", warnings: [], uncertain: [], missing: [], error: error instanceof Error ? error.message : "연결 실패" };
      }
      await sleep(3_000);
    }
  }
  return { ok: false, seconds: 0, subject: "", draft: "", koreanVersion: "", warnings: [], uncertain: [], missing: [], error: "호출 제한(429) 반복" };
}

/** 규칙 준수를 기계로 확인할 수 있는 부분 (사람의 판정을 대신하지 않는다) */
function autoChecks(testCase: Case, outcome: Outcome): string[] {
  const problems: string[] = [];
  const text = `${outcome.subject}\n${outcome.draft}`;
  if (outcome.subject.trim() === "") problems.push("제목 없음");
  if (outcome.draft.trim() === "") problems.push("본문 없음");
  if (/\[[^\]\n]*\]/.test(text)) problems.push("대괄호 표시 남음");
  if (/[가-힣]/.test(text)) problems.push("한글 섞임");
  if (/Sir or Madam|To Whom It May Concern|敬启者/.test(text)) problems.push("불특정 호칭");
  if (testCase.language === "en" && /\b(don't|can't|won't|isn't|aren't|we're|I'm|it's|we'll|I'll)\b/i.test(text)) problems.push("줄임말");
  // 입력에 없는 연도·날짜를 지어냈는지 (입력 전체 글에 없는 4자리 연도)
  const inputText = JSON.stringify(testCase);
  for (const year of text.match(/\b(19|20)\d{2}\b/g) ?? []) {
    if (!inputText.includes(year)) problems.push(`입력에 없는 연도 ${year}`);
  }
  if (testCase.language === "en" && !testCase.dateTime && /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/.test(text)) {
    problems.push("입력에 없는 날짜");
  }
  return Array.from(new Set(problems));
}

const LANG_LABEL = { en: "영어", zh: "중국어", ja: "일본어" } as const;
const TYPE_LABEL = { request: "협조 요청", reply: "회신", thanks: "감사" } as const;
const RECIPIENT_LABEL = { government: "정부기관", company: "기업", other: "기타" } as const;
const FORMALITY_LABEL = { general: "일반 업무", formal: "공식", highest: "최고 격식" } as const;

async function main(): Promise<void> {
  const results: { testCase: Case; outcome: Outcome; problems: string[] }[] = [];
  let lastStart = 0;
  for (const [index, testCase] of CASES.entries()) {
    const wait = lastStart + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
    const outcome = await callApi(testCase);
    const problems = outcome.ok ? autoChecks(testCase, outcome) : [`생성 실패: ${outcome.error}`];
    results.push({ testCase, outcome, problems });
    console.log(`${index + 1}/${CASES.length} ${LANG_LABEL[testCase.language]} ${TYPE_LABEL[testCase.letterType]} → ${outcome.ok ? "생성" : "실패"} ${problems.length > 0 ? `(${problems.join(", ")})` : ""}`);
  }

  const ok = results.filter((r) => r.outcome.ok).length;
  const clean = results.filter((r) => r.problems.length === 0).length;
  const avg = results.filter((r) => r.outcome.ok).reduce((sum, r) => sum + r.outcome.seconds, 0) / Math.max(ok, 1);
  const date = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    `# 테스트 공문 20건 평가 기록 (${date})`,
    "",
    `- 서버: ${BASE} · 모델: 서버의 \`OPENAI_MODEL\` 설정(없으면 기본 모델)`,
    `- 생성 성공 ${ok}/${CASES.length}건 · 기계 점검 문제 없음 ${clean}건 · 평균 생성 시간 ${avg.toFixed(1)}초`,
    "- 기계 점검: 제목·본문 존재, 대괄호 표시, 한글 섞임, 불특정 호칭, 영어 줄임말, 입력에 없는 연도·날짜",
    "- **발송 가능 / 격식·호칭 오류는 사람이 아래 표를 보고 직접 채웁니다.** (판정 1: 부서 선배, 판정 2: 외국 거주 경험자·번역 전문가)",
    "",
    "## 한눈에 보기",
    "",
    "| 번호 | 언어 | 종류 | 수신처 | 격식 | 입력 | 생성 시간(초) | 기계 점검 | 판정 1 | 판정 2 | 발송 가능 | 격식·호칭 오류 메모 |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  results.forEach(({ testCase, outcome, problems }, index) => {
    lines.push(
      `| ${index + 1} | ${LANG_LABEL[testCase.language]}${testCase.chineseScript === "traditional" ? "(번체)" : ""} | ${TYPE_LABEL[testCase.letterType]} | ${RECIPIENT_LABEL[testCase.recipientType]} | ${FORMALITY_LABEL[testCase.formality]} | ${testCase.sparse ? "일부 비움" : "충분"} | ${outcome.seconds} | ${problems.length === 0 ? "✅" : `❌ ${problems.join(", ")}`} |  |  |  |  |`,
    );
  });
  lines.push("", "## 건별 결과", "");
  results.forEach(({ testCase, outcome, problems }, index) => {
    lines.push(`### ${index + 1}. ${LANG_LABEL[testCase.language]} · ${TYPE_LABEL[testCase.letterType]} · ${RECIPIENT_LABEL[testCase.recipientType]} · ${FORMALITY_LABEL[testCase.formality]}`, "");
    lines.push("**입력**", "", "```json", JSON.stringify(testCase, null, 2), "```", "");
    if (!outcome.ok) {
      lines.push(`**생성 실패**: ${outcome.error}`, "");
      return;
    }
    lines.push(`**제목**: ${outcome.subject}`, "", "**초안**", "", "```", outcome.draft, "```", "", "**한국어 확인본**", "", "```", outcome.koreanVersion, "```", "");
    if (outcome.warnings.length > 0) lines.push(`**경고**: ${outcome.warnings.join(" / ")}`, "");
    if (outcome.uncertain.length > 0) lines.push(`**확인 필요**: ${outcome.uncertain.join(" / ")}`, "");
    if (outcome.missing.length > 0) lines.push(`**빠진 항목 제안**: ${outcome.missing.join(" / ")}`, "");
    lines.push(`**기계 점검**: ${problems.length === 0 ? "문제 없음" : problems.join(", ")}`, "");
  });

  mkdirSync("eval-results", { recursive: true });
  const path = `eval-results/eval-${date}.md`;
  writeFileSync(path, lines.join("\n"));
  console.log(`\n저장: ${path} — 성공 ${ok}/${CASES.length}, 문제 없음 ${clean}건`);
}

await main();
