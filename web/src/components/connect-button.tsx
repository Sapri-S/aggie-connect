"use client";

import { useState, useTransition } from "react";
import {
  removeConnection,
  respondToRequest,
  sendConnectionRequest,
  type ActionResult,
} from "@/app/network/actions";

// Serializable version of ConnectionState from lib/connections.
export type ConnectState =
  | { kind: "none" }
  | { kind: "outgoing"; id: number }
  | { kind: "incoming"; id: number }
  | { kind: "connected"; id: number };

const primary =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60";
const secondary =
  "rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-tint disabled:opacity-60";

export function ConnectButton({
  otherId,
  firstName,
  state,
  compact = false,
}: {
  otherId: string;
  firstName: string;
  state: ConnectState;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirmRemove, setConfirmRemove] = useState(false);

  function run(action: () => Promise<ActionResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      setConfirmRemove(false);
    });
  }

  let controls: React.ReactNode;
  switch (state.kind) {
    case "none":
      controls = (
        <button className={primary} disabled={pending} onClick={() => run(() => sendConnectionRequest(otherId))}>
          {pending ? "Sending…" : "Connect"}
        </button>
      );
      break;
    case "outgoing":
      controls = (
        <>
          <span className="rounded-md bg-primary-tint px-3 py-2 text-sm font-semibold text-primary">
            Request sent
          </span>
          {!compact && (
            <button className={secondary} disabled={pending} onClick={() => run(() => removeConnection(state.id))}>
              {pending ? "Withdrawing…" : "Withdraw"}
            </button>
          )}
        </>
      );
      break;
    case "incoming":
      controls = (
        <>
          <button className={primary} disabled={pending} onClick={() => run(() => respondToRequest(state.id, true))}>
            Accept
          </button>
          <button className={secondary} disabled={pending} onClick={() => run(() => respondToRequest(state.id, false))}>
            Ignore
          </button>
        </>
      );
      break;
    case "connected":
      controls = confirmRemove ? (
        <>
          <span className="text-sm text-muted">Remove {firstName} from your connections?</span>
          <button className={secondary} disabled={pending} onClick={() => run(() => removeConnection(state.id))}>
            {pending ? "Removing…" : "Remove"}
          </button>
          <button className={secondary} disabled={pending} onClick={() => setConfirmRemove(false)}>
            Keep
          </button>
        </>
      ) : (
        <>
          <span className="inline-flex items-center gap-1 rounded-md bg-gold px-3 py-2 text-sm font-semibold text-on-gold">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-current">
              <path d="M7.7 14.3 3.4 10l1.4-1.4 2.9 2.9 7.5-7.5 1.4 1.4z" />
            </svg>
            Connected
          </span>
          {!compact && (
            <button className={secondary} onClick={() => setConfirmRemove(true)}>
              Remove
            </button>
          )}
        </>
      );
      break;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">{controls}</div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
