"use client";

import { useActionState } from "react";
import { resendConfirmation } from "./actions";
import { FormMessage } from "@/components/form-fields";
import { Turnstile } from "@/components/turnstile";
import { EMAIL_ENABLED } from "@/lib/site";
import type { FormState } from "@/lib/validation";

// "Didn't get the email?" for an address we already know (just signed up, or
// just tried to sign in unconfirmed). Its own form, so it can sit next to or
// after another form without nesting.
export function ResendConfirmation({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendConfirmation, {});

  if (!EMAIL_ENABLED) return null;
  if (state.success) return <FormMessage success={state.success} />;

  return (
    <form action={action} className="space-y-2 text-sm">
      <FormMessage error={state.error} />
      <input type="hidden" name="email" value={email} />
      <Turnstile resetKey={state} />
      <p className="text-muted">
        Didn&apos;t get the email, or the link expired?{" "}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline disabled:opacity-60 sm:min-h-0"
        >
          {pending ? "Sending…" : "Send a new link"}
        </button>
      </p>
    </form>
  );
}
