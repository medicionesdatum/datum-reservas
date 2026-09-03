import { NextRequest, NextResponse } from "next/server";

const excludedPrefixes = ["/api/", "/_next/", "/assets/"];
const excludedFiles = ["/favicon.ico", "/robots.txt", "/sitemap.xml", "/llms.txt"];

export function middleware(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const { pathname } = request.nextUrl;

  if (
    request.method !== "GET" ||
    !accept.includes("text/markdown") ||
    excludedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    excludedFiles.includes(pathname)
  ) {
    const response = NextResponse.next();
    response.headers.append("Vary", "Accept");
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/api/markdown";
  url.searchParams.set("path", pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
