"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resolveReport, type ActionResult } from "./actions";

export type Report = {
  id: number;
  reason: "fake" | "spam" | "harassment" | "inappropriate" | "other";
  details: string | null;
  created_at: string;
  target_id: string;
  target_first_name: string;
  target_last_name: string;
  target_status: "pending" | "approved" | "suspended";
  reporter_id: string | null;
  reporter_name: string;
};

const REASON_LABEL: Record<Report["reason"], string> = {
  fake: "Fake / not an Aggie",
  spam: "Spam or selling",
  harassment: "Harassment",
  inappropriate: "Inappropriate content",
  other: "Other",
};

const size =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border px-3 text-sm font-semibold disabled:opacity-60 lg:min-h-0 lg:flex-none lg:py-1.5";
const btn = `${size} border-line hover:bg-primary-tint`;

export function ReportList({ reports, me }: { reports: Report[]; me: string }) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted">No open reports. Aggie Pride!</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} isMe={r.target_id === me} />
      ))}
    </ul>
  );
}

function ReportRow({ report: r, isMe }: { report: Report; isMe: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: () => Promise<ActionResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/u/${r.target_id}`} className="inline-flex min-h-11 items-center font-semibold hover:underline lg:min-h-0">
            {r.target_first_name} {r.target_last_name}
          </Link>
          <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-on-gold">
            {REASON_LABEL[r.reason]}
          </span>
          {r.target_status === "suspended" && (
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-xs font-semibold text-danger">suspended</span>
          )}
        </div>
        {r.details && <p className="mt-1 whitespace-pre-line text-sm">{r.details}</p>}
        <p className="mt-1 text-sm text-muted">
          Reported by{" "}
          {r.reporter_id ? (
            <Link href={`/u/${r.reporter_id}`} className="hover:underline">
              {r.reporter_name}
            </Link>
          ) : (
            r.reporter_name
          )}{" "}
          on {new Date(r.created_at).toLocaleDateString()}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {r.target_status !== "suspended" && !isMe && (
          <button
            className={`${btn} border-danger text-danger`}
            disabled={pending}
            onClick={() => run(() => resolveReport(r.id, r.target_id))}
          >
            Suspend &amp; close
          </button>
        )}
        <button className={btn} disabled={pending} onClick={() => run(() => resolveReport(r.id, null))}>
          {pending ? "Saving…" : "Dismiss"}
        </button>
      </div>
    </li>
  );
}
