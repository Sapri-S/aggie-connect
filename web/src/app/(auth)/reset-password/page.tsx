"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setNewPassword } from "../actions";
import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

// Reached from the reset email: /auth/confirm verifies the link, signs the
// user in, and sends them here to choose a new password.
export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(setNewPassword, {});

  return (
    <AuthCard title="Choose a new password">
      <form action={action} className="space-y-4" noValidate>
        <FormMessage error={state.error} />
        {state.error?.includes("expired") && (
          <Link href="/forgot-password" className="block text-sm font-semibold text-primary hover:underline">
            Send a new reset link
          </Link>
        )}
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          hint="At least 10 characters."
          errors={state.fieldErrors?.password}
        />
        <Field
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          errors={state.fieldErrors?.confirm}
        />
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
