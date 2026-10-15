// 선택·입력이 바뀔 때마다 화면 오른쪽에 바로 보여 주는 "형식 미리보기".
// AI를 부르지 않고 입력값을 공문 구조(수신 → 제목 → 본문 → 발신)에 배치만 한다.
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
  // 언어를 아직 고르지 않았으면 영어 형식으로 보여 준다.
  if (language === "en" || language === "") {
    return `${date.day} ${MONTHS_EN[date.month - 1]} ${date.year}`;
  }
  return `${date.year}年${date.month}月${date.day}日`;
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

/** 입력값을 공문 구조에 맞춰 배치한 미리보기 문자열을 만든다. */
export function buildPreview(input: PreviewInput): string {
  const p = PHRASES[input.language] ?? PHRASES.en;
  const type = input.letterType in p.base ? input.letterType : "other";
  const named = input.recipientName.trim() !== "";
  const title = input.recipientTitle.trim();
  const name = input.recipientName.trim();
  const org = input.recipientOrg.trim();

  // 1) 수신
  const recipient: string[] = [];
  if (title || name) recipient.push([title, name].filter(Boolean).join(" "));
  if (org) recipient.push(input.language === "ja" && !named ? `${org} 御中` : org);
  if (input.country.trim()) recipient.push(input.country.trim());

  // 2) 제목
  const subject =
    input.purpose.trim() ||
    p.base[type] ||
    input.letterTypeNote.trim();

  // 3) 본문
  const salutation =
    named || title ? p.salutation(title, name) : p.anonymousSalutation;
  const body: string[] = [salutation, "", p.intro(input.senderOrg.trim())];
  if (input.purpose.trim()) body.push(p.regarding(input.purpose.trim()));
  const dateText = formatDate(input.language, input.date);
  if (dateText) body.push(`${p.dateLabel}: ${dateText}`);
  if (input.place.trim()) body.push(`${p.placeLabel}: ${input.place.trim()}`);
  if (input.content.trim()) body.push(input.content.trim());
  body.push("", p.closing[type] ?? p.closing.other);

  // 4) 발신
  const sender = [input.senderOrg.trim(), input.senderName.trim()].filter(Boolean);

  return [
    recipient.join("\n"),
    subject,
    body.join("\n"),
    [p.sign(named), ...sender].join("\n"),
  ]
    .filter((part) => part.trim() !== "")
    .join("\n\n");
}
