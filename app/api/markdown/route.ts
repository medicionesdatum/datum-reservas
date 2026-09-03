import { NextResponse } from "next/server";
import { markdownForPath } from "@/lib/markdown-content";

export function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.searchParams.get("path") ?? "/";
  const markdown = markdownForPath(pathname);

  return new NextResponse(markdown.body, {
    status: markdown.status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept, Accept-Encoding"
    }
  });
}
