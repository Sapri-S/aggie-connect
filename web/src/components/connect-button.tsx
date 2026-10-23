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

// On phones the controls fill their row in equal widths, 44px tall; from
// `sm` up they're compact and right-aligned.
const size =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md border px-4 text-sm font-semibold sm:min-h-0 sm:flex-none sm:py-2";
const primary = `${size} border-transparent bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-60`;
const secondary = `${size} border-line text-ink hover:bg-primary-tint disabled:opacity-60`;

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
          <span className={`${size} border-transparent bg-primary-tint text-primary`}>
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
          <span className="basis-full text-sm text-muted sm:basis-auto">
            Remove {firstName} from your connections?
          </span>
          <button className={secondary} disabled={pending} onClick={() => run(() => removeConnection(state.id))}>
            {pending ? "Removing…" : "Remove"}
          </button>
          <button className={secondary} disabled={pending} onClick={() => setConfirmRemove(false)}>
            Keep
          </button>
        </>
      ) : (
        <>
          <span
            className={`${
              compact ? "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold" : `${size} border-transparent`
            } bg-gold text-on-gold`}
          >
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
    <div className={`flex flex-col gap-1 sm:items-end ${compact ? "items-end" : "w-full sm:w-auto"}`}>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{controls}</div>
      {error && (
        <p role="alert" className="text-sm text-danger sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
