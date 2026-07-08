import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { createHrEveProxyToken } from "@/lib/eve-proxy-auth";

const EVE_INTERNAL_PREFIX = "/_eve_internal/eve";

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-encoding",
  "cache-control",
  "content-type",
  "last-event-id",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-type",
  "x-eve-session-id",
] as const;

function buildInternalEveUrl(request: NextRequest, pathSegments: string[]): URL {
  const pathname = `${EVE_INTERNAL_PREFIX}/${pathSegments.join("/")}`;
  const url = new URL(pathname, request.nextUrl.origin);
  url.search = request.nextUrl.search;
  return url;
}

function pickHeaders(
  source: Headers,
  allowed: readonly string[]
): Headers {
  const headers = new Headers();
  for (const name of allowed) {
    const value = source.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

export async function proxyEveRequest(
  request: NextRequest,
  pathSegments: string[],
  method: "GET" | "POST"
): Promise<Response> {
  const { session, response } = await requireAdminApi();
  if (response) {
    return response;
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bearerToken: string;
  try {
    bearerToken = await createHrEveProxyToken(session);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Eve proxy token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const upstreamUrl = buildInternalEveUrl(request, pathSegments);
  const headers = pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS);
  headers.set("authorization", `Bearer ${bearerToken}`);

  const upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body: method === "POST" ? request.body : undefined,
    duplex: method === "POST" ? "half" : undefined,
  } as RequestInit);

  const responseHeaders = pickHeaders(
    upstream.headers,
    FORWARDED_RESPONSE_HEADERS
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
