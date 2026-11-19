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

const status = "inline-flex items-center gap-1 rounded-md bg-primary-tint text-sm font-semibold text-primary";

export function ConnectButton({
  otherId,
  firstName,
  state,
  compact = false,
  fill = false,
}: {
  otherId: string;
  firstName: string;
  state: ConnectState;
  compact?: boolean;
  /** Buttons always fill the available width (for cards). */
  fill?: boolean;
}) {
  // On phones the controls fill their row in equal widths, 44px tall; from
  // `sm` up they are compact and right-aligned, unless `fill`.
  const size = `btn flex-1 px-4 text-sm ${fill ? "" : "sm:flex-none"}`;
  const primary = `${size} btn-primary`;
  const secondary = `${size} btn-secondary`;
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
          <span className={`${size} ${status} cursor-default`}>
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
            className={compact ? `${status} px-3 py-2` : `${size} ${status} cursor-default`}
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
    <div className={`flex flex-col gap-1 ${fill ? "w-full" : `sm:items-end ${compact ? "items-end" : "w-full sm:w-auto"}`}`}>
      <div className={`flex flex-wrap items-center gap-2 ${fill ? "" : "sm:justify-end"}`}>{controls}</div>
      {error && (
        <p role="alert" className="text-sm text-danger sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
