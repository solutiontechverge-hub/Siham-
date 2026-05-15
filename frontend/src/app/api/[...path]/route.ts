import { NextRequest, NextResponse } from "next/server";
import { backendProxyTarget, useBackendProxy } from "../../../lib/backendProxyTarget";

type RouteContext = { params: { path: string[] } };

async function proxyRequest(request: NextRequest, { params }: RouteContext) {
  if (!useBackendProxy) {
    return NextResponse.json({ error: "API proxy is not enabled" }, { status: 404 });
  }

  const path = params.path.join("/");
  const target = `${backendProxyTarget}/api/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }
  const bypass = process.env.VERCEL_PROTECTION_BYPASS;
  if (bypass) {
    headers.set("x-vercel-protection-bypass", bypass);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetch(target, init);
  const upstreamType = upstream.headers.get("content-type") ?? "";
  const responseHeaders = new Headers();

  if (upstreamType.includes("text/html")) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Live API is blocked by Vercel Deployment Protection. Use the local backend (npm run dev in /backend) or set VERCEL_PROTECTION_BYPASS in frontend/.env.local.",
        data: null,
      },
      { status: 502 },
    );
  }

  if (upstreamType) {
    responseHeaders.set("content-type", upstreamType);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
