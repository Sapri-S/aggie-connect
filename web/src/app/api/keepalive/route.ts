import { createClient } from "@supabase/supabase-js";
import { NextResponse, connection, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Supabase pauses free-plan projects after about a week without database
// activity. A Vercel cron (see vercel.json) calls this once a day and runs
// one tiny query, which counts as activity.
//
// The query uses the publishable key with no session, so nothing is
// returned or changed; it only needs to reach Postgres. When CRON_SECRET is set in Vercel, Vercel sends it as a Bearer
// token and other callers are refused.
export async function GET(request: NextRequest) {
  await connection();

  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from("profiles").select("id").limit(1);

  // The anon role has no grant on profiles, so Postgres answers 42501
  // (permission denied). That answer comes from the database itself, which
  // is all the keep-alive needs. Anything else means Postgres wasn't reached.
  if (error && error.code !== "42501") {
    console.error("keepalive query failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
