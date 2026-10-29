"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "../actions";
import { FormMessage } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <div className="space-y-3">
      <h2 className="font-bold">Delete your account</h2>
      <p className="text-sm text-muted">
        This permanently removes your profile, photo and connections. It
        can&apos;t be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center rounded-md border border-danger px-4 text-sm font-semibold text-danger hover:bg-primary-tint sm:min-h-0 sm:py-2"
        >
          Delete my account
        </button>
      ) : (
        <form action={action} className="space-y-3">
          <FormMessage error={state.error} />
          <label htmlFor="confirm-delete" className="block text-sm font-semibold">
            Type DELETE to confirm
          </label>
          <input
            id="confirm-delete"
            name="confirm"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-ink focus:border-danger focus:outline-none sm:w-64"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending || typed !== "DELETE"}
              className="inline-flex min-h-11 items-center rounded-md bg-danger px-4 text-sm font-semibold text-surface hover:brightness-110 disabled:opacity-50 sm:min-h-0 sm:py-2"
            >
              {pending ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm font-semibold hover:bg-primary-tint sm:min-h-0 sm:py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
