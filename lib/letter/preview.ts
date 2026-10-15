// 선택·입력이 바뀔 때마다 화면 오른쪽에 바로 보여 주는 "형식 미리보기".
// AI를 부르지 않고 입력값을 공문 구조(수신 → 제목 → 본문 → 발신)에 배치만 한다.
// 아무것도 고르거나 적지 않았으면 비어 있고, 선택·입력할 때마다 해당 부분이 차례로 채워진다.
// 입력한 한국어 단어는 그대로 들어가며, [초안 만들기]를 누르면 AI가 완성된 외국어 초안으로 바꿔 준다.
import type { ParsedDate } from "./options";

export type PreviewInput = {
  language: string;
  letterType: string;
  letterTypeNote: string;
  purpose: string;
  country: string;
  recipientOrg: string;
  recipientName: string;
  recipientTitle: string;
  date: ParsedDate;
  place: string;
  senderOrg: string;
  senderName: string;
  content: string;
};

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(language: string, date: ParsedDate): string {
  if (date.kind !== "ok") return "";
  if (language === "en") {
    return `${date.day} ${MONTHS_EN[date.month - 1]} ${date.year}`;
  }
  if (language === "zh" || language === "ja") {
    return `${date.year}年${date.month}月${date.day}日`;
  }
  // 언어를 아직 고르지 않았으면 입력한 그대로(2026.10.13) 보여 준다.
  return `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}`;
}

type Phrases = {
  base: Record<string, string>;
  intro: (org: string) => string;
  regarding: (purpose: string) => string;
  dateLabel: string;
  placeLabel: string;
  closing: Record<string, string>;
  anonymousSalutation: string;
  salutation: (title: string, name: string) => string;
  sign: (named: boolean) => string;
};

const PHRASES: Record<string, Phrases> = {
  en: {
    base: {
      attendance: "Invitation to Attend",
      request: "Request for Cooperation",
      reply: "Reply",
      thanks: "Letter of Thanks",
      other: "",
    },
    intro: (org) =>
      org
        ? `I am writing on behalf of ${org}.`
        : "I am writing to you regarding the following matter.",
    regarding: (purpose) => `Regarding: ${purpose}`,
    dateLabel: "Date",
    placeLabel: "Venue",
    closing: {
      attendance:
        "We would be most grateful if you could confirm your attendance.",
      request: "We would greatly appreciate your kind cooperation.",
      reply: "We are pleased to reply to your letter as set out above.",
      thanks: "We would like to express our sincere gratitude.",
      other: "We look forward to your favorable response.",
    },
    anonymousSalutation: "Dear Sir or Madam,",
    salutation: (title, name) =>
      `Dear ${[title, name].filter(Boolean).join(" ")},`,
    sign: (named) => (named ? "Yours sincerely," : "Yours faithfully,"),
  },
  zh: {
    base: {
      attendance: "邀请函",
      request: "协助请求",
      reply: "回函",
      thanks: "感谢函",
      other: "",
    },
    intro: (org) => (org ? `我谨代表${org}致函贵方。` : "现就以下事宜致函贵方。"),
    regarding: (purpose) => `事由：${purpose}`,
    dateLabel: "日期",
    placeLabel: "地点",
    closing: {
      attendance: "恳请贵方确认是否出席。",
      request: "恳请贵方予以协助，不胜感激。",
      reply: "现就来函回复如上。",
      thanks: "谨致以诚挚的谢意。",
      other: "期待您的回复。",
    },
    anonymousSalutation: "敬启者：",
    salutation: (title, name) => `尊敬的${name}${title}：`,
    sign: () => "此致\n敬礼",
  },
  ja: {
    base: {
      attendance: "ご出席のお願い",
      request: "ご協力のお願い",
      reply: "ご回答",
      thanks: "御礼",
      other: "",
    },
    intro: (org) =>
      org ? `${org}よりご連絡申し上げます。` : "下記の件につきましてご連絡申し上げます。",
    regarding: (purpose) => `件名：${purpose}`,
    dateLabel: "日時",
    placeLabel: "場所",
    closing: {
      attendance: "ご出席の可否をお知らせいただけましたら幸いです。",
      request: "何卒ご協力くださいますようお願い申し上げます。",
      reply: "ご照会の件につきまして、上記のとおりご回答申し上げます。",
      thanks: "心より御礼申し上げます。",
      other: "何卒よろしくお願い申し上げます。",
    },
    anonymousSalutation: "拝啓",
    salutation: (title, name) => `${[title, name].filter(Boolean).join(" ")}様`,
    sign: () => "敬具",
  },
};

/**
 * 입력한 만큼만 공문 구조에 배치한 미리보기 문자열을 만든다.
 * - 언어를 고르기 전에는 고정 문구 없이 입력한 단어만 순서대로 보여 준다(언어가 섞이지 않게).
 * - 언어를 고르면 해당 언어의 호칭·문장 틀이 입력에 맞춰 하나씩 붙는다.
 * 아무 입력도 없으면 빈 문자열을 돌려준다.
 */
export function buildPreview(input: PreviewInput): string {
  const p: Phrases | null = PHRASES[input.language] ?? null;
  const type = input.letterType in (p?.base ?? {}) ? input.letterType : "other";

  const title = input.recipientTitle.trim();
  const name = input.recipientName.trim();
  const org = input.recipientOrg.trim();
  const country = input.country.trim();
  const purpose = input.purpose.trim();
  const senderOrg = input.senderOrg.trim();
  const senderName = input.senderName.trim();
  const content = input.content.trim();
  const place = input.place.trim();
  const dateText = formatDate(input.language, input.date);
  const named = name !== "";
  const hasType = input.letterType !== "";
  const hasRecipient = Boolean(title || name || org || country);
  const hasAnyBody = Boolean(purpose || dateText || place || content);

  // 1) 수신
  const recipient: string[] = [];
  if (title || name) recipient.push([title, name].filter(Boolean).join(" "));
  if (org) recipient.push(p && input.language === "ja" && !named ? `${org} 御中` : org);
  if (country) recipient.push(country);

  // 2) 제목
  const subject = purpose || (p ? p.base[type] : "") || input.letterTypeNote.trim();

  // 3) 본문 (언어를 고른 뒤에만 고정 문구가 붙는다)
  const body: string[] = [];
  if (p) {
    if (hasRecipient || hasType || hasAnyBody) {
      body.push(named || title ? p.salutation(title, name) : p.anonymousSalutation);
    }
    if (senderOrg || purpose) body.push(p.intro(senderOrg));
    if (purpose) body.push(p.regarding(purpose));
    if (dateText) body.push(`${p.dateLabel}: ${dateText}`);
    if (place) body.push(`${p.placeLabel}: ${place}`);
    if (content) body.push(content);
    if (hasType) body.push(p.closing[type] ?? p.closing.other);
  } else {
    if (dateText) body.push(dateText);
    if (place) body.push(place);
    if (content) body.push(content);
  }

  // 4) 발신
  const sender: string[] = [];
  if (p && (hasType || senderOrg || senderName)) sender.push(p.sign(named));
  if (senderOrg) sender.push(senderOrg);
  if (senderName) sender.push(senderName);

  return [
    recipient.join("\n"),
    subject,
    body.join("\n"),
    sender.join("\n"),
  ]
    .filter((part) => part.trim() !== "")
    .join("\n\n");
}
