import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The avatars bucket is private. Storage RLS decides who may read each
// file, and we hand the browser short-lived signed URLs.
const SIGNED_URL_SECONDS = 60 * 60;

export async function signAvatarUrls(
  supabase: Supabase,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;

  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrls(unique, SIGNED_URL_SECONDS);

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
