import type { NextRequest } from "next/server";

import { proxyEveRequest } from "@/lib/eve-proxy";

type EveRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handleEveProxy(
  request: NextRequest,
  context: EveRouteContext,
  method: "GET" | "POST"
) {
  const { path } = await context.params;
  return proxyEveRequest(request, path, method);
}

export async function GET(request: NextRequest, context: EveRouteContext) {
  return handleEveProxy(request, context, "GET");
}

export async function POST(request: NextRequest, context: EveRouteContext) {
  return handleEveProxy(request, context, "POST");
}
