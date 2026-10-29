"use client";

import { useActionState } from "react";
import { reportMember } from "./actions";
import { FormMessage, SubmitButton, TextArea } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

const REASONS = [
  { value: "fake", label: "Fake account or not an Aggie" },
  { value: "spam", label: "Spam or selling" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "inappropriate", label: "Inappropriate photo or content" },
  { value: "other", label: "Something else" },
] as const;

// A <details> disclosure, so the form stays out of the way until needed.
export function ReportForm({ target, firstName }: { target: string; firstName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportMember, {});

  return (
    <details className="mt-8 border-t border-line pt-4 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-muted hover:text-ink sm:min-h-0">
        Report {firstName}
      </summary>
      {state.success ? (
        <div className="mt-3">
          <FormMessage success={state.success} />
        </div>
      ) : (
        <form action={action} className="mt-3 space-y-4 sm:max-w-md">
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
            {state.fieldErrors?.reason && (
              <p className="mt-1 text-danger">{state.fieldErrors.reason[0]}</p>
            )}
          </fieldset>
          <TextArea
            label="Details (optional)"
            name="details"
            rows={3}
            maxLength={500}
            hint="Only admins see this. We won't tell them who reported."
            errors={state.fieldErrors?.details}
          />
          <div className="sm:w-48">
            <SubmitButton pending={pending}>Send report</SubmitButton>
          </div>
        </form>
      )}
    </details>
  );
}
