"use client";

import { useActionState, useRef } from "react";
import { reportMember } from "./actions";
import { DotsIcon } from "@/components/icons";
import { FormMessage, SubmitButton, TextArea } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

const REASONS = [
  { value: "fake", label: "Fake account or not an Aggie" },
  { value: "spam", label: "Spam or selling" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "inappropriate", label: "Inappropriate photo or content" },
  { value: "other", label: "Something else" },
] as const;

// The "…" button on someone else's profile: a small menu with "Report",
// which opens the report form in a dialog. Native <dialog> and popover, so
// Escape, focus trapping and light dismiss come from the browser.
export function ProfileMoreMenu({ target, firstName }: { target: string; firstName: string }) {
  const menu = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        popoverTarget="profile-more"
        aria-label={`More options for ${firstName}`}
        className="btn btn-secondary w-11 px-0 sm:w-9"
      >
        <DotsIcon className="h-5 w-5" />
      </button>
      <div
        id="profile-more"
        ref={menu}
        popover="auto"
        // Under the button where anchor positioning is supported; elsewhere
        // the browser centers it, which still works as a small menu.
        className="w-56 rounded-lg border border-line bg-surface p-1.5 text-ink shadow-xl supports-[position-area:bottom]:inset-auto supports-[position-area:bottom]:mt-1 supports-[position-area:bottom]:[position-area:bottom_span-left] supports-[position-area:bottom]:[position-try-fallbacks:flip-block]"
      >
        <button
          type="button"
          onClick={() => {
            menu.current?.hidePopover();
            dialog.current?.showModal();
          }}
          className="flex min-h-11 w-full items-center rounded-md px-3 text-left font-semibold hover:bg-surface-2"
        >
          Report {firstName}
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="report-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-surface p-0 text-ink shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="report-title" className="text-lg font-bold">
            Report {firstName}
          </h2>
          <form method="dialog">
            <button aria-label="Close" className="btn btn-ghost w-11 px-0 text-xl sm:w-9">
              ×
            </button>
          </form>
        </div>
        <div className="p-4">
          <ReportForm target={target} />
        </div>
      </dialog>
    </>
  );
}

function ReportForm({ target }: { target: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportMember, {});

  if (state.success) return <FormMessage success={state.success} />;

  return (
    <form action={action} className="space-y-4 text-sm">
      <FormMessage error={state.error} />
      <input type="hidden" name="target" value={target} />
      <fieldset>
        <legend className="font-semibold">What&apos;s wrong?</legend>
        <div className="mt-2 space-y-1">
          {REASONS.map((r) => (
            <label key={r.value} className="flex min-h-11 items-center gap-3 sm:min-h-0 sm:py-1">
              <input type="radio" name="reason" value={r.value} required className="h-4 w-4" />
              {r.label}
            </label>
          ))}
        </div>
        {state.fieldErrors?.reason && <p className="mt-1 text-danger">{state.fieldErrors.reason[0]}</p>}
      </fieldset>
      <TextArea
        label="Details (optional)"
        name="details"
        rows={3}
        maxLength={500}
        hint="Only admins see this. We won't tell them who reported."
        errors={state.fieldErrors?.details}
      />
      <SubmitButton pending={pending}>Send report</SubmitButton>
    </form>
  );
}
