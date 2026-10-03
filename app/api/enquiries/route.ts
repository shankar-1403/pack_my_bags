import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getEnquiries, saveEnquiries } from "@/lib/content";
import { checkEnquiry } from "@/lib/enquiry-rules";
import { fail } from "@/lib/guard";
import type { Enquiry } from "@/lib/types";

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = clip(body.name, 80);
    const email = clip(body.email, 120);
    const message = clip(body.message, 2000);
    const phone = clip(body.phone, 30);
    const problem = Object.values(checkEnquiry({ name, email, phone, message }))[0];
    if (problem) throw new Error(problem);
    const item: Enquiry = {
      id: randomUUID(),
      name,
      email,
      phone,
      tripSlug: clip(body.tripSlug, 80),
      tripTitle: clip(body.tripTitle, 140),
      departure: clip(body.departure, 80),
      message,
      createdAt: new Date().toISOString(),
      status: "new",
    };
    const items = [item, ...getEnquiries()];
    saveEnquiries(items);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
