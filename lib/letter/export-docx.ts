// 공문을 Word(.docx) 파일로 만든다. 한글(HWP)에서도 열 수 있다. 브라우저에서만 실행한다(서버로 보내지 않음).
import { Document, Packer, Paragraph, TextRun } from "docx";

const FONTS: Record<string, { ascii: string; eastAsia: string }> = {
  en: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
  ja: { ascii: "Yu Mincho", eastAsia: "Yu Mincho" },
  zh: { ascii: "SimSun", eastAsia: "SimSun" },
};

/** 문서 전체 글(제목 포함)을 한 줄씩 문단으로 나눠 .docx Blob으로 만든다. */
export async function buildDocx(language: string, text: string): Promise<Blob> {
  const font = FONTS[language] ?? FONTS.en;
  const paragraphs = text.split("\n").map(
    (line) =>
      new Paragraph({
        spacing: { after: 120, line: 360 },
        children: [
          new TextRun({
            text: line,
            font: { ascii: font.ascii, hAnsi: font.ascii, eastAsia: font.eastAsia },
            size: 22,
          }),
        ],
      }),
  );
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children: paragraphs,
      },
    ],
  });
  return Packer.toBlob(doc);
}

/** 파일 이름에 쓸 수 없는 글자를 빼고 길이를 줄인다. */
export function safeFileName(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|\n\r]/g, " ").trim().slice(0, 40);
  return `${cleaned === "" ? "공문 초안" : cleaned}.docx`;
}
