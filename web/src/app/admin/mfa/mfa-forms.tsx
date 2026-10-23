"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";
import { startEnrolment, verifyCode, type Enrolment } from "./actions";

function CodeForm({ factorId, submitLabel }: { factorId: string; submitLabel: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyCode, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error} />
      <input type="hidden" name="factorId" value={factorId} />
      <Field
        label="6-digit code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={7}
        required
        autoFocus
        errors={state.fieldErrors?.code}
      />
      <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
    </form>
  );
}

// Already set up: enter a code from the app to reach /admin.
export function VerifyForm({ factorId }: { factorId: string }) {
  return (
    <div className="space-y-4">
      <p className="text-muted">Enter the code from your authenticator app to open the admin tools.</p>
      <CodeForm factorId={factorId} submitLabel="Continue" />
    </div>
  );
}

// Not set up yet: create a factor, scan it, confirm with a first code.
export function EnrolForm() {
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enrolment || "error" in enrolment) {
    return (
      <div className="space-y-4">
        <p className="text-muted">
          Admins can see every member&apos;s email, so admin tools need a second step: a code from an
          authenticator app such as Google Authenticator, Microsoft Authenticator, 1Password or Authy.
        </p>
        <FormMessage error={enrolment?.error} />
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setEnrolment(await startEnrolment()))}
          className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "One moment…" : "Set up authenticator app"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted">Scan this with your authenticator app, then enter the code it shows.</p>
      {/* A data: URI from Supabase, so next/image has nothing to optimize. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={enrolment.qrCode}
        alt="QR code for your authenticator app"
        width={192}
        height={192}
        className="mx-auto rounded-md bg-white p-2"
      />
      <details className="text-sm">
        <summary className="cursor-pointer text-primary">Can&apos;t scan it?</summary>
        <p className="mt-2 text-muted">Enter this key in your app instead:</p>
        <code className="mt-1 block break-all rounded-md bg-primary-tint px-3 py-2 font-mono text-ink">
          {enrolment.secret}
        </code>
      </details>
      <CodeForm factorId={enrolment.factorId} submitLabel="Turn on two-factor" />
    </div>
  );
}
