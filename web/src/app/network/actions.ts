"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Arguments to Server Actions come from the browser, so check their shape.
// Who may do what is enforced again by RLS in the database.
function validId(id: unknown): id is number {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, me: user?.id };
}

function refresh(otherId?: string) {
  revalidatePath("/network");
  revalidatePath("/home");
  if (otherId) revalidatePath(`/u/${otherId}`);
}

export async function sendConnectionRequest(otherId: string): Promise<ActionResult> {
  if (typeof otherId !== "string" || !UUID.test(otherId)) {
    return { error: "That member doesn't exist." };
  }
  const { supabase, me } = await session();
  if (!me) return { error: "Your session expired. Sign in again." };
  if (me === otherId) return { error: "You can't connect with yourself." };

  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: me, receiver_id: otherId });

  if (error?.code === "23505") {
    // A connection already exists between you. If they asked you first
    // (even one you ignored), clicking Connect accepts it.
    const { error: acceptError } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("requester_id", otherId)
      .eq("receiver_id", me);
    if (acceptError) return { error: "Couldn't connect. Try again." };
  } else if (error?.code === "P0001") {
    // Over the request limit (see 20261025000000_connection_limits.sql). If
    // they already asked you, connecting doesn't need a new request.
    const { data: accepted } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("requester_id", otherId)
      .eq("receiver_id", me)
      .select("id")
      .maybeSingle();
    if (!accepted) {
      return {
        error: "You've sent a lot of requests lately. Try again tomorrow, or wait for some to be answered.",
      };
    }
  } else if (error?.code === "42501") {
    return { error: "You can connect with Aggies once your account is approved." };
  } else if (error) {
    console.error("sendConnectionRequest failed", error.code);
    return { error: "Couldn't send your request. Try again." };
  }

  refresh(otherId);
  return {};
}

export async function respondToRequest(
  connectionId: number,
  accept: boolean,
): Promise<ActionResult> {
  if (!validId(connectionId) || typeof accept !== "boolean") {
    return { error: "That request doesn't exist." };
  }
  const { supabase, me } = await session();
  if (!me) return { error: "Your session expired. Sign in again." };

  const { data, error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", connectionId)
    .eq("receiver_id", me)
    .select("requester_id")
    .maybeSingle();

  if (error || !data) return { error: "Couldn't update that request. Try again." };
  refresh(data.requester_id);
  return {};
}

// Withdraws a request you sent, or removes an existing connection.
export async function removeConnection(connectionId: number): Promise<ActionResult> {
  if (!validId(connectionId)) return { error: "That connection doesn't exist." };
  const { supabase, me } = await session();
  if (!me) return { error: "Your session expired. Sign in again." };

  const { data, error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .select("requester_id, receiver_id")
    .maybeSingle();

  if (error || !data) return { error: "Couldn't remove that connection. Try again." };
  refresh(data.requester_id === me ? data.receiver_id : data.requester_id);
  return {};
}
