type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(options.key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterMs: 0,
    };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.resetAt - now),
    };
  }

  bucket.count += 1;
  buckets.set(options.key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterMs: 0,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

export function enforceRateLimit(
  request: Request,
  namespace: string,
  limit: number,
  windowMs: number
): Response | null {
  const ip = getClientIp(request);
  const result = checkRateLimit({
    key: `${namespace}:${ip}`,
    limit,
    windowMs,
  });

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterMs);
  }

  return null;
}

/** @internal Test helper */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
