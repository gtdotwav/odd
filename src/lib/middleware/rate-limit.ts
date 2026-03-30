import { NextResponse } from "next/server";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import type { RateLimitConfig } from "@/lib/rate-limit";

/**
 * Higher-order function that wraps an API route handler with rate limiting.
 *
 * Uses X-Forwarded-For header to identify clients (standard on Vercel).
 *
 * @example
 * ```ts
 * export const POST = withRateLimit(async (req) => {
 *   // handler logic
 *   return NextResponse.json({ ok: true });
 * }, rateLimits.trade);
 * ```
 */
export function withRateLimit(
  handler: (req: Request, ...args: unknown[]) => Promise<NextResponse>,
  config?: RateLimitConfig,
) {
  const limit = config ?? rateLimits.api;

  return async (req: Request, ...args: unknown[]): Promise<NextResponse> => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const result = checkRateLimit(ip, limit);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Muitas requisições. Tente novamente em breve.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
            "Retry-After": String(Math.ceil(result.retryAfter / 1000)),
          },
        },
      );
    }

    const response = await handler(req, ...args);

    // Attach rate limit headers to successful responses too
    response.headers.set("X-RateLimit-Limit", String(limit.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));

    return response;
  };
}
