import { cookies } from "next/headers";
import { createHmac } from "crypto";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123@";
const ADMIN_CLERK_ID = "admin_local";
const COOKIE_NAME = "odd_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "odd-admin-secret-key-change-in-prod";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function verifyCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function createSessionToken(): string {
  const payload = `${ADMIN_CLERK_ID}:${Date.now()}`;
  const signature = sign(payload);
  return `${payload}:${signature}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;

  const [clerkId, timestamp, signature] = parts;
  const payload = `${clerkId}:${timestamp}`;
  const expected = sign(payload);

  if (signature !== expected) return null;

  // Token expires after 24 hours
  const age = Date.now() - Number(timestamp);
  if (age > 24 * 60 * 60 * 1000) return null;

  return clerkId;
}

export async function getAdminClerkId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;
  return verifySessionToken(session.value);
}

export { COOKIE_NAME, ADMIN_CLERK_ID };
