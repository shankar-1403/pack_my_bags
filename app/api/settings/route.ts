import { NextResponse } from "next/server";
import { saveSettings } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanSettings } from "@/lib/validate";

export async function PUT(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const settings = cleanSettings(await request.json());
    saveSettings(settings);
    return NextResponse.json({ settings });
  } catch (error) {
    return fail(error);
  }
}
