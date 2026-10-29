"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../actions";
import { ForgotWithoutEmail } from "../forgot-without-email";
import { ResendConfirmation } from "../resend-confirmation";
import { EMAIL_ENABLED } from "@/lib/site";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import { Turnstile } from "@/components/turnstile";
import type { FormState } from "@/lib/validation";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <div className="space-y-4">
      {/* The resend link is its own form, so the error sits outside the
          sign-in form to keep the two together. */}
      <FormMessage error={state.error ?? notice} />
      {state.unconfirmed && state.values?.email && (
        <ResendConfirmation key={state.values.email} email={state.values.email} />
      )}
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
          errors={state.fieldErrors?.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          errors={state.fieldErrors?.password}
        />
        <div className="-mt-2 text-right">
          {EMAIL_ENABLED ? (
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline sm:min-h-0"
            >
              Forgot password?
            </Link>
          ) : (
            <ForgotWithoutEmail />
          )}
        </div>
        <Turnstile resetKey={state} />
        <SubmitButton pending={pending}>Sign in</SubmitButton>
        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Join Aggie Connect
          </Link>
        </p>
      </form>
    </div>
  );
}
