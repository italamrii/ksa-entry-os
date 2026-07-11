import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { DISCLAIMER_EN } from "@/lib/constants";

interface StepData {
  title: string;
  authority: string;
  description: string;
  complexity: string;
  riskLevel: string;
  officialUrl?: string | null;
  disclaimer?: string | null;
}

interface ReportData {
  companyName: string;
  sector: string;
  generatedAt: string;
  summary: string;
  steps: StepData[];
}

export async function generateRoadmapPdf(data: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.08, 0.12, 0.22);
  const emerald = rgb(0.06, 0.72, 0.51);
  const gray = rgb(0.4, 0.4, 0.45);
  const white = rgb(1, 1, 1);

  // Cover page
  let page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: navy });
  page.drawText("KSA Entry OS", { x: 50, y: height - 60, size: 28, font: fontBold, color: white });
  page.drawText("Saudi Market Entry Roadmap", { x: 50, y: height - 90, size: 14, font, color: emerald });

  page.drawText(data.companyName, { x: 50, y: height - 200, size: 22, font: fontBold, color: navy });
  page.drawText(`Sector: ${data.sector}`, { x: 50, y: height - 230, size: 12, font, color: gray });
  page.drawText(`Generated: ${data.generatedAt}`, { x: 50, y: height - 250, size: 10, font, color: gray });
  page.drawText("Information last reviewed: March 2026", { x: 50, y: height - 270, size: 10, font, color: gray });

  page.drawText("Summary", { x: 50, y: height - 320, size: 14, font: fontBold, color: navy });
  const summaryLines = wrapText(data.summary, 80);
  let y = height - 345;
  for (const line of summaryLines.slice(0, 6)) {
    page.drawText(line, { x: 50, y, size: 10, font, color: gray });
    y -= 14;
  }

  // Steps pages
  page = doc.addPage([595, 842]);
  y = height - 50;
  page.drawText("Recommended Roadmap", { x: 50, y, size: 18, font: fontBold, color: navy });
  y -= 30;

  for (let i = 0; i < data.steps.length; i++) {
    const step = data.steps[i];
    if (y < 120) {
      page = doc.addPage([595, 842]);
      y = height - 50;
    }

    page.drawText(`${i + 1}. ${step.title}`, { x: 50, y, size: 12, font: fontBold, color: navy });
    y -= 16;
    page.drawText(`Authority: ${step.authority}`, { x: 60, y, size: 9, font, color: gray });
    y -= 14;
    page.drawText(`Complexity: ${step.complexity} | Risk: ${step.riskLevel}`, { x: 60, y, size: 9, font, color: gray });
    y -= 14;

    const descLines = wrapText(step.description, 85);
    for (const line of descLines.slice(0, 4)) {
      page.drawText(line, { x: 60, y, size: 9, font, color: gray });
      y -= 12;
    }

    if (step.officialUrl) {
      page.drawText(`Official link: ${step.officialUrl}`, { x: 60, y, size: 8, font, color: emerald });
      y -= 12;
    }

    y -= 10;
  }

  // Disclaimer page
  page = doc.addPage([595, 842]);
  page.drawText("Legal Disclaimer", { x: 50, y: height - 50, size: 14, font: fontBold, color: navy });
  const disclaimerLines = wrapText(DISCLAIMER_EN, 90);
  y = height - 80;
  for (const line of disclaimerLines) {
    page.drawText(line, { x: 50, y, size: 8, font, color: gray });
    y -= 11;
  }

  return doc.save();
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}
