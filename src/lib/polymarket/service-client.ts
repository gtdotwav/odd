import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service client for server-side operations without cookie context
// Used by cron jobs and background sync
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
