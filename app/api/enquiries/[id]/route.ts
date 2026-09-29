import { NextResponse } from "next/server";
import { getEnquiries, saveEnquiries } from "@/lib/content";
import { denyIfGuest } from "@/lib/guard";
import type { Enquiry } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const body = await request.json();
  const status: Enquiry["status"] = body.status === "contacted" ? "contacted" : "new";
  const items = getEnquiries().map((item) => (item.id === id ? { ...item, status } : item));
  saveEnquiries(items);
  return NextResponse.json({ items });
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const items = getEnquiries().filter((item) => item.id !== id);
  saveEnquiries(items);
  return NextResponse.json({ items });
}
