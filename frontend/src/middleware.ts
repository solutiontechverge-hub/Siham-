import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isLocalHost(host: string) {
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (process.env.NODE_ENV === "production" && host && !isLocalHost(host)) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (!proto.includes("https")) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  const response = NextResponse.next();

  if (process.env.NODE_ENV === "production" && host && !isLocalHost(host)) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
