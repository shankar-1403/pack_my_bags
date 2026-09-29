import { NextResponse } from "next/server";
import { CMS_COOKIE, cmsToken, passwordsMatch } from "@/lib/cms-token";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!passwordsMatch(String(body.password ?? ""))) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CMS_COOKIE, cmsToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
