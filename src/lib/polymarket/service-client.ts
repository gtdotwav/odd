import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service client for server-side operations without cookie context
// Used by cron jobs and background sync
// IMPORTANT: service_role key is REQUIRED for writes — anon key is blocked by RLS
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!serviceKey) {
    console.warn("[service-client] SUPABASE_SERVICE_ROLE_KEY not set — cron writes will fail due to RLS. Get it from Supabase Dashboard > Settings > API.");
  }

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
