import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

// Handles the link in Supabase's confirmation email. Supports both the
// token_hash template (works in any browser) and the default PKCE ?code=.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("missing token") };

  const url = request.nextUrl.clone();
  url.search = "";
  if (error) {
    url.pathname = "/login";
    url.searchParams.set("error", "confirm_failed");
  } else {
    url.pathname = next;
  }
  return NextResponse.redirect(url);
}
