import mammoth from "mammoth";
import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { denyIfGuest, fail } from "@/lib/guard";
import { parseTripDocument } from "@/lib/trip-document";

const MAX_BYTES = 10 * 1024 * 1024;

/** Reads a filled destination form (.docx, .pdf, .txt, .md) and returns the fields it found. Nothing is saved. */
export async function POST(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose the filled form to upload.");
    if (file.size > MAX_BYTES) throw new Error("That file is over 10 MB.");
    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";
    if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else if (name.endsWith(".pdf")) {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      text = (await extractText(pdf, { mergePages: true })).text;
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf8");
    } else if (name.endsWith(".doc")) {
      throw new Error("Old .doc files can't be read. In Word, use File → Save As → Word Document (.docx), then upload again.");
    } else {
      throw new Error("Upload the form as a Word (.docx), PDF, or text file.");
    }
    if (!text.trim()) throw new Error("No text found in that file. If it is a scanned PDF, use the Word form instead.");
    return NextResponse.json(parseTripDocument(text));
  } catch (error) {
    return fail(error);
  }
}
