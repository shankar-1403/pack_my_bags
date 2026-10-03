import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admins";
import { CMS_COOKIE, SESSION_DAYS, createSession } from "@/lib/cms-token";

/** Receives the Firebase ID token from the login form and, for an active admin, starts a CMS session. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const idToken = String(body.idToken ?? "");
  if (!idToken) return NextResponse.json({ error: "Sign in first." }, { status: 400 });
  const result = await verifyAdmin(idToken);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CMS_COOKIE, createSession(result.uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
  return response;
}
