import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
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

type Tab = "invitations" | "connections" | "sent";
const TABS: { value: Tab; label: string }[] = [
  { value: "invitations", label: "Invitations" },
  { value: "connections", label: "Connections" },
  { value: "sent", label: "Sent" },
];

export default function NetworkPage({ searchParams }: PageProps<"/network">) {
  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Network searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Network({ searchParams }: Pick<PageProps<"/network">, "searchParams">) {
  const sp = await searchParams;
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
  // Your declined requests still look pending to you, the way LinkedIn does.
  const outgoing = (rows ?? []).filter((r) => r.requester_id === me && r.status !== "accepted");
  const connected = (rows ?? []).filter((r) => r.status === "accepted");
  const otherId = (r: { requester_id: string; receiver_id: string }) =>
    r.requester_id === me ? r.receiver_id : r.requester_id;

  const counts: Record<Tab, number> = {
    invitations: incoming.length,
    connections: connected.length,
    sent: outgoing.length,
  };
  const asked = typeof sp.tab === "string" ? sp.tab : "";
  const tab: Tab = TABS.some((t) => t.value === asked)
    ? (asked as Tab)
    : incoming.length > 0
      ? "invitations"
      : "connections";
  const shown = tab === "invitations" ? incoming : tab === "sent" ? outgoing : connected;

  const ids = [...new Set(shown.map(otherId))];
  const { data: people } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, class_year, headline, job_title, company, avatar_path")
        .in("id", ids)
    : { data: [] as Person[] };
  const byId = new Map((people ?? []).map((p) => [p.id, p as Person]));
  const urls = await signAvatarUrls(supabase, (people ?? []).map((p) => p.avatar_path));
  const avatarUrl = (p: Person) => (p.avatar_path ? urls.get(p.avatar_path) : null);

  return (
    <div className="space-y-4">
      <div className="card px-4 pt-4">
        <h1 className="text-2xl font-bold">My network</h1>
        <nav aria-label="Network sections" className="mt-2 flex overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/network?tab=${t.value}`}
              aria-current={tab === t.value ? "page" : undefined}
              className={`relative flex min-h-12 shrink-0 items-center gap-1.5 px-3 font-semibold ${
                tab === t.value
                  ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t after:bg-primary"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {counts[t.value] > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs leading-5 ${
                    t.value === "invitations" ? "bg-gold text-on-gold" : "bg-surface-2 text-muted"
                  }`}
                >
                  {counts[t.value]}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {shown.length === 0 ? (
        <p className="card px-4 py-10 text-center text-muted">
          {tab === "invitations" && "No invitations right now."}
          {tab === "sent" && "You haven't sent any requests that are still waiting."}
          {tab === "connections" && (
            <>
              No connections yet. Find Aggies in the{" "}
              <Link href="/directory" className="font-semibold text-primary hover:underline">
                directory
              </Link>{" "}
              and tap Connect.
            </>
          )}
        </p>
      ) : tab === "invitations" ? (
        // Request cards, like a friend-requests page.
        <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {incoming.map((r) => {
            const p = byId.get(otherId(r));
            if (!p) return null;
            return (
              <li key={r.id} className="card flex flex-col p-3 text-center">
                <Link href={`/u/${p.id}`} className="group flex flex-col items-center gap-2">
                  <Avatar url={avatarUrl(p)} firstName={p.first_name} lastName={p.last_name} size="lg" />
                  <PersonText person={p} centered />
                </Link>
                <div className="mt-auto pt-3">
                  <ConnectButton otherId={p.id} firstName={p.first_name} state={{ kind: "incoming", id: r.id }} fill />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="card divide-y divide-line">
          {shown.map((r) => {
            const p = byId.get(otherId(r));
            if (!p) return null;
            const state: ConnectState =
              tab === "sent" ? { kind: "outgoing", id: r.id } : { kind: "connected", id: r.id };
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                <Link href={`/u/${p.id}`} className="group flex min-w-0 flex-1 basis-60 items-center gap-3">
                  <Avatar url={avatarUrl(p)} firstName={p.first_name} lastName={p.last_name} size="md" />
                  <PersonText person={p} />
                </Link>
                <div className="ml-auto">
                  <ConnectButton otherId={p.id} firstName={p.first_name} state={state} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PersonText({ person: p, centered = false }: { person: Person; centered?: boolean }): ReactNode {
  const work = [p.job_title, p.company].filter(Boolean).join(" at ");
  return (
    <span className={`min-w-0 ${centered ? "w-full" : ""}`}>
      <span className="block truncate font-semibold group-hover:underline">
        {p.first_name} {p.last_name}
        {p.class_year && <span className="ml-1 font-normal text-muted">&apos;{String(p.class_year).slice(-2)}</span>}
      </span>
      <span className="block truncate text-sm text-muted">{work || p.headline || "Aggie"}</span>
    </span>
  );
}
