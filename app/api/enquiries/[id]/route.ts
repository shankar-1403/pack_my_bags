import { NextResponse } from "next/server";
import { deleteEnquiry, getEnquiries, setEnquiryStatus } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import type { Enquiry } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status: Enquiry["status"] = body.status === "contacted" ? "contacted" : "new";
    await setEnquiryStatus(id, status);
    return NextResponse.json({ items: await getEnquiries() });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await deleteEnquiry(id);
    return NextResponse.json({ items: await getEnquiries() });
  } catch (error) {
    return fail(error);
  }
}
