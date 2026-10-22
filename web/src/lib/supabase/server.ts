import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseKey, supabaseUrl } from "./env";

// Supabase client for Server Components, Server Actions and Route Handlers.
// It acts as the signed-in user, so Row Level Security always applies.
// Never use the service-role key here.
export async function createClient() {
  // Supabase checks token expiry with Date.now(), which Cache Components
  // forbids while prerendering (even a prefetch that can see cookies).
  // Waiting for a real request keeps everything below out of prerendering.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies. The proxy refreshes the
          // session on every request, so this is safe to ignore.
        }
      },
    },
  });
}
