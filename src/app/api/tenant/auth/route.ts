import { NextResponse } from "next/server";
import {
  verifyTenantCredentials,
  createTenantSessionToken,
  getTenantId,
  COOKIE_NAME,
} from "@/lib/tenant-auth";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`tenant:${ip}`, rateLimits.auth);
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Muitas tentativas. Aguarde." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
    }

    if (!verifyTenantCredentials(email, password)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const token = createTenantSessionToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET() {
  const tenantId = await getTenantId();
  if (tenantId) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
