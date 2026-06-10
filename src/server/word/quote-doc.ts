import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { QuotePdfData } from "@/server/pdf/quote-document";

function money(v: string, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(v));
}

function cell(text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts.bold })],
      }),
    ],
  });
}

export async function buildQuoteDocx(data: QuotePdfData): Promise<Buffer> {
  const cur = data.currency;

  const headerRow = new TableRow({
    children: [
      cell("Item", { bold: true }),
      cell("Qty", { bold: true, align: AlignmentType.RIGHT }),
      cell("Unit", { bold: true, align: AlignmentType.RIGHT }),
      cell("Tax", { bold: true, align: AlignmentType.RIGHT }),
      cell("Total", { bold: true, align: AlignmentType.RIGHT }),
    ],
  });

  const lineRows = data.lines.map(
    (l) =>
      new TableRow({
        children: [
          cell(l.description ? `${l.name} — ${l.description}` : l.name),
          cell(String(Number(l.qty)), { align: AlignmentType.RIGHT }),
          cell(money(l.unitPrice, cur), { align: AlignmentType.RIGHT }),
          cell(`${Number(l.taxRate)}%`, { align: AlignmentType.RIGHT }),
          cell(money(l.lineTotal, cur), { align: AlignmentType.RIGHT }),
        ],
      })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [headerRow, ...lineRows],
  });

  const totalLine = (label: string, value: string, bold = false) =>
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `${label}: ${value}`, bold })],
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "OpenCRM AI", bold: true })],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: `${data.quoteNo} · ${data.status.toUpperCase()}` })],
          }),
          new Paragraph({ children: [new TextRun({ text: `From: ${data.orgName}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Billed to: ${data.accountName ?? "—"}` })] }),
          ...(data.validUntil ? [new Paragraph({ children: [new TextRun({ text: `Valid until: ${data.validUntil}` })] })] : []),
          new Paragraph({ text: "" }),
          table,
          new Paragraph({ text: "" }),
          totalLine("Subtotal", money(data.subtotal, cur)),
          totalLine("Discount", `- ${money(data.discount, cur)}`),
          totalLine("Tax", money(data.tax, cur)),
          totalLine("Total", money(data.total, cur), true),
          ...(data.notes
            ? [new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: "Notes", bold: true })] }), new Paragraph({ children: [new TextRun({ text: data.notes })] })]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
