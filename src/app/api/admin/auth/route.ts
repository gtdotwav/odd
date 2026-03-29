import { NextResponse } from "next/server";
import {
  verifyCredentials,
  createSessionToken,
  getAdminClerkId,
  COOKIE_NAME,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "missing_credentials" },
        { status: 400 },
      );
    }

    if (!verifyCredentials(email, password)) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 },
      );
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const clerkId = await getAdminClerkId();
  if (clerkId) {
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
