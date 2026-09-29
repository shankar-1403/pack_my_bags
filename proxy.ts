import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CMS_COOKIE, cmsToken } from "./lib/cms-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (request.cookies.get(CMS_COOKIE)?.value === cmsToken()) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
