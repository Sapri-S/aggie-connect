import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Supabase client with the SECRET key. It bypasses Row Level Security, so:
// - it's only used for things the database can't do on its own (sending
//   invite emails through Supabase Auth),
// - only after the caller has been checked to be an admin,
// - and the key is never NEXT_PUBLIC_, so it never reaches the browser.
//
// Returns null when the key isn't configured; inviting is then disabled.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
