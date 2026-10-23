"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error ?? notice} />
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
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline sm:min-h-0"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton pending={pending}>Sign in</SubmitButton>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Join Aggie Connect
        </Link>
      </p>
    </form>
  );
}
