import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { NextResponse } from "next/server";
import { getTrips } from "@/lib/content";
import { denyIfGuest } from "@/lib/guard";
import { slugify } from "@/lib/format";
import { tripToBlocks, type Block } from "@/lib/trip-document";

const PINE = "1B3A33";
const ORANGE = "F94F18";
const MIST = "7C746A";

function paragraph(block: Block) {
  switch (block.kind) {
    case "title":
      return new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 120 }, children: [new TextRun({ text: block.text, bold: true, color: PINE, size: 36, font: "Calibri" })] });
    case "note":
      return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: block.text, italics: true, color: MIST, size: 18, font: "Calibri" })] });
    case "heading":
      return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: block.text, bold: true, color: ORANGE, size: 24, font: "Calibri" })] });
    case "field":
      return new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: `${block.label}: `, bold: true, color: PINE, size: 22, font: "Calibri" }), new TextRun({ text: block.value, size: 22, font: "Calibri" })],
      });
    case "text":
      return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: block.text, size: 22, font: "Calibri" })] });
    case "bullet":
      return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: block.text, size: 22, font: "Calibri" })] });
    case "gap":
      return new Paragraph({ alignment: AlignmentType.LEFT, children: [] });
  }
}

/** The destination form as a Word document: blank, or filled from an existing trip (?id=…). */
export async function GET(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  const trip = id ? (await getTrips()).find((t) => t.id === id) ?? null : null;
  if (id && !trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });

  const doc = new Document({
    creator: "PackMyBags CMS",
    title: trip ? `${trip.title} — destination form` : "Destination form",
    sections: [{ properties: {}, children: tripToBlocks(trip).map(paragraph) }],
  });
  const buffer = await Packer.toBuffer(doc);
  const name = trip ? `${slugify(trip.title) || "destination"}-form.docx` : "packmybags-destination-form.docx";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
