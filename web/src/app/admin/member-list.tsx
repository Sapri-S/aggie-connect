"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { removeMember, setMemberStatus, type ActionResult } from "./actions";

export type Member = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "student" | "alumni" | "admin";
  status: "pending" | "approved" | "suspended";
  class_year: number | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_demo: boolean;
};

const FILTERS = ["pending", "approved", "suspended", "all"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_STYLE: Record<Member["status"], string> = {
  pending: "bg-gold text-on-gold",
  approved: "bg-primary-tint text-primary",
  suspended: "bg-primary-tint text-danger",
};

// Equal-width, 44px buttons on phones and tablets; compact once rows go
// horizontal at `lg`.
const size =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border px-3 text-sm font-semibold disabled:opacity-60 lg:min-h-0 lg:flex-none lg:py-1.5";
const btn = `${size} border-line hover:bg-primary-tint`;

export function MemberList({ members, me }: { members: Member[]; me: string }) {
  const pendingCount = members.filter((m) => m.status === "pending").length;
  const [filter, setFilter] = useState<Filter>(pendingCount > 0 ? "pending" : "all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (filter === "all" || m.status === filter) &&
        (!q || `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q)),
    );
  }, [members, filter, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap" role="tablist">
          {FILTERS.map((f) => {
            const count = f === "all" ? members.length : members.filter((m) => m.status === f).length;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-11 rounded-md px-3 text-sm font-semibold capitalize sm:min-h-0 sm:py-1.5 ${
                  filter === f ? "bg-primary text-on-primary" : "text-muted hover:bg-primary-tint hover:text-ink"
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search members"
          className="min-h-11 w-full rounded-md border border-line bg-surface px-3 text-base sm:min-h-0 sm:w-64 sm:py-1.5 sm:text-sm"
        />
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No members here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {shown.map((m) => (
            <MemberRow key={m.id} member={m} isMe={m.id === me} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberRow({ member: m, isMe }: { member: Member; isMe: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  function run(action: () => Promise<ActionResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      setConfirming(false);
    });
  }

  const joined = new Date(m.created_at).toLocaleDateString();
  const lastSeen = m.last_sign_in_at ? new Date(m.last_sign_in_at).toLocaleDateString() : "never";

  return (
    <li className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/u/${m.id}`} className="inline-flex min-h-11 items-center font-semibold hover:underline lg:min-h-0">
            {m.first_name} {m.last_name}
          </Link>
          {m.class_year && <span className="text-sm text-primary">&apos;{String(m.class_year).slice(-2)}</span>}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[m.status]}`}>
            {m.status}
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 text-xs capitalize text-muted">{m.role}</span>
          {m.is_demo && <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">demo</span>}
          {isMe && <span className="text-xs text-muted">(you)</span>}
        </div>
        {/* Phones: email on its own line, dates under it. */}
        <p className="mt-1 text-sm text-muted sm:mt-0 sm:truncate">
          <span className="block truncate sm:inline">{m.email}</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">
            joined {joined} · last sign-in {lastSeen}
          </span>
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {!isMe && (
        <div className="flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="basis-full text-sm text-danger lg:basis-auto">
                Remove {m.first_name} permanently? This deletes their account, profile and connections.
              </span>
              <button className={`${btn} border-danger text-danger`} disabled={pending} onClick={() => run(() => removeMember(m.id))}>
                {pending ? "Removing…" : "Yes, remove"}
              </button>
              <button className={btn} disabled={pending} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {m.status !== "approved" && (
                <button
                  className={`${size} border-transparent bg-primary text-on-primary hover:bg-primary-hover`}
                  disabled={pending}
                  onClick={() => run(() => setMemberStatus(m.id, "approved"))}
                >
                  {m.status === "pending" ? "Approve" : "Reactivate"}
                </button>
              )}
              {m.status === "approved" && m.role !== "admin" && (
                <button className={btn} disabled={pending} onClick={() => run(() => setMemberStatus(m.id, "suspended"))}>
                  Suspend
                </button>
              )}
              <button className={`${btn} text-danger`} disabled={pending} onClick={() => setConfirming(true)}>
                Remove
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
