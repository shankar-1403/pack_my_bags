import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getEnquiries, saveEnquiries } from "@/lib/content";
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
    if (!name || !email.includes("@") || !message) {
      throw new Error("Name, email, and a message are required.");
    }
    const item: Enquiry = {
      id: randomUUID(),
      name,
      email,
      phone: clip(body.phone, 30),
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
