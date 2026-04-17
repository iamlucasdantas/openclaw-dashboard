import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth;
  const path = nextUrl.pathname;

  const isPublic =
    path === "/login" ||
    path.startsWith("/invite/") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next");

  if (!isAuthed && !isPublic) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (isAuthed && path === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (path.startsWith("/admin") && !(req.auth?.user as any)?.isAdmin) {
    return NextResponse.redirect(new URL("/client", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
