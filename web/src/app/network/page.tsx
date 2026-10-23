import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectButton, type ConnectState } from "@/components/connect-button";
import { signAvatarUrls } from "@/lib/avatars";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My network" };

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  class_year: number | null;
  headline: string | null;
  job_title: string | null;
  company: string | null;
  avatar_path: string | null;
};

export default function NetworkPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Network />
      </Suspense>
    </div>
  );
}

async function Network() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/network");
  const me = user.id;

  // RLS returns only connections you're part of.
  const { data: rows, error } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load your network (${error.code}: ${error.message})`);

  const incoming = (rows ?? []).filter((r) => r.receiver_id === me && r.status === "pending");
  const outgoing = (rows ?? []).filter((r) => r.requester_id === me && r.status !== "accepted");
  const connected = (rows ?? []).filter((r) => r.status === "accepted");
  const otherId = (r: { requester_id: string; receiver_id: string }) =>
    r.requester_id === me ? r.receiver_id : r.requester_id;

  const ids = [...new Set([...incoming, ...outgoing, ...connected].map(otherId))];
  const { data: people } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, class_year, headline, job_title, company, avatar_path")
        .in("id", ids)
    : { data: [] as Person[] };
  const byId = new Map((people ?? []).map((p) => [p.id, p as Person]));
  const urls = await signAvatarUrls(supabase, (people ?? []).map((p) => p.avatar_path));

  function Row({ person, state }: { person: Person | undefined; state: ConnectState }) {
    if (!person) return null;
    const work = [person.job_title, person.company].filter(Boolean).join(" at ");
    // A "Connected" badge fits beside the name; buttons go under it on phones.
    const inline = state.kind === "connected";
    return (
      <li
        className={`flex gap-3 py-4 ${
          inline ? "items-center justify-between" : "flex-col sm:flex-row sm:items-center sm:justify-between"
        }`}
      >
        <Link href={`/u/${person.id}`} className="flex min-w-0 items-center gap-3 hover:underline">
          <Avatar
            url={person.avatar_path ? urls.get(person.avatar_path) : null}
            firstName={person.first_name}
            lastName={person.last_name}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {person.first_name} {person.last_name}
              {person.class_year && (
                <span className="ml-1 text-primary">&apos;{String(person.class_year).slice(-2)}</span>
              )}
            </p>
            <p className="truncate text-sm text-muted">{work || person.headline || "Aggie"}</p>
          </div>
        </Link>
        <ConnectButton otherId={person.id} firstName={person.first_name} state={state} compact={state.kind === "connected"} />
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My network</h1>

      <Section title="Invitations" count={incoming.length} empty="No pending invitations.">
        {incoming.map((r) => (
          <Row key={r.id} person={byId.get(otherId(r))} state={{ kind: "incoming", id: r.id }} />
        ))}
      </Section>

      <Section title="Connections" count={connected.length} empty="No connections yet. Find Aggies on the home page and click Connect.">
        {connected.map((r) => (
          <Row key={r.id} person={byId.get(otherId(r))} state={{ kind: "connected", id: r.id }} />
        ))}
      </Section>

      {outgoing.length > 0 && (
        <Section title="Sent" count={outgoing.length} empty="">
          {outgoing.map((r) => (
            <Row key={r.id} person={byId.get(otherId(r))} state={{ kind: "outgoing", id: r.id }} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface px-4 py-4 sm:px-5">
      <h2 className="font-bold">
        {title} <span className="text-muted">({count})</span>
      </h2>
      {count > 0 ? (
        <ul className="divide-y divide-line">{children}</ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}
