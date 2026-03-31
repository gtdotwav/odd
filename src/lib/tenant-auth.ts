import { cookies } from "next/headers";
import { createHmac } from "crypto";

const TENANT_EMAIL = process.env.TENANT_EMAIL || "tenant";
const TENANT_PASSWORD = process.env.TENANT_PASSWORD || "tenant123@";
const TENANT_ID = "tenant_local";
const COOKIE_NAME = "odd_tenant_session";
const SECRET = process.env.TENANT_SESSION_SECRET || "odd-tenant-secret-key-change-in-prod";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function verifyTenantCredentials(email: string, password: string): boolean {
  return email === TENANT_EMAIL && password === TENANT_PASSWORD;
}

export function createTenantSessionToken(): string {
  const payload = `${TENANT_ID}:${Date.now()}`;
  const signature = sign(payload);
  return `${payload}:${signature}`;
}

export function verifyTenantSessionToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;

  const [tenantId, timestamp, signature] = parts;
  const payload = `${tenantId}:${timestamp}`;
  const expected = sign(payload);

  if (signature !== expected) return null;

  const age = Date.now() - Number(timestamp);
  if (age > 24 * 60 * 60 * 1000) return null;

  return tenantId;
}

export async function getTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;
  return verifyTenantSessionToken(session.value);
}

export { COOKIE_NAME, TENANT_ID };
