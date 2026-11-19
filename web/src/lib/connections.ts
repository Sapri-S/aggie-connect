import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// How the signed-in user relates to someone else.
// "declined" is shown to the requester as still pending, the way LinkedIn
// does it, so nobody is told they were turned down.
export type ConnectionState =
  | { kind: "none" }
  | { kind: "outgoing"; id: number }
  | { kind: "incoming"; id: number }
  | { kind: "connected"; id: number };

export async function connectionWith(
  supabase: Supabase,
  me: string,
  other: string,
): Promise<ConnectionState> {
  // RLS only returns connections you're part of.
  const { data } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .or(
      `and(requester_id.eq.${me},receiver_id.eq.${other}),and(requester_id.eq.${other},receiver_id.eq.${me})`,
    )
    .maybeSingle();

  if (!data) return { kind: "none" };
  if (data.status === "accepted") return { kind: "connected", id: data.id };
  if (data.requester_id === me) return { kind: "outgoing", id: data.id };
  // Requests you declined disappear for you; the other person can't resend.
  if (data.status === "declined") return { kind: "none" };
  return { kind: "incoming", id: data.id };
}

export async function pendingRequestCount(supabase: Supabase, me: string) {
  const { count } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", me)
    .eq("status", "pending");
  return count ?? 0;
}

// How the signed-in user relates to everyone they have a connection row
// with, keyed by the other person's id. Same rules as connectionWith():
// a request you declined disappears for you; your declined request still
// looks pending to you. Anyone missing from the map is { kind: "none" }.
export async function connectionStates(supabase: Supabase, me: string) {
  // RLS only returns connections you're part of.
  const { data } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .limit(2000);
  const states = new Map<string, ConnectionState>();
  for (const r of data ?? []) {
    const other = r.requester_id === me ? r.receiver_id : r.requester_id;
    if (r.status === "accepted") states.set(other, { kind: "connected", id: r.id });
    else if (r.requester_id === me) states.set(other, { kind: "outgoing", id: r.id });
    else if (r.status !== "declined") states.set(other, { kind: "incoming", id: r.id });
  }
  return states;
}
