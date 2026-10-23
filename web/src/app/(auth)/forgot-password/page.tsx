"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <AuthCard title="Reset your password">
      {state.success ? (
        <div className="space-y-4">
          <FormMessage success={state.success} />
          <p className="text-sm text-muted">
            The link works once and expires after an hour. Check your spam
            folder if it doesn&apos;t show up.
          </p>
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-4" noValidate>
          <p className="text-sm text-muted">
            Enter the email you signed up with and we&apos;ll send you a link
            to choose a new password.
          </p>
          <FormMessage error={state.error} />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            errors={state.fieldErrors?.email}
          />
          <SubmitButton pending={pending}>Send reset link</SubmitButton>
          <p className="text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
