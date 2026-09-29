import { NextResponse } from "next/server";
import { CMS_COOKIE } from "@/lib/cms-token";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CMS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
