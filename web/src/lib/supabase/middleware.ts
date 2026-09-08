import { NextResponse, type NextRequest } from "next/server";
import {
  isMockSessionValue,
  MOCK_AUTH_COOKIE,
} from "@/lib/mock-auth";

export function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/login" || pathname.startsWith("/login/");
  const session = request.cookies.get(MOCK_AUTH_COOKIE)?.value;
  const isLoggedIn = isMockSessionValue(session);

  if (!isLoggedIn && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/wealth-map";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
