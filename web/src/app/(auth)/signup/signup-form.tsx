"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  const [role, setRole] = useState<"student" | "alumni">("student");

  if (state.success) {
    return <FormMessage success={state.success} />;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error} />

      <fieldset>
        <legend className="text-sm font-semibold">I am a…</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["student", "Current student"],
              ["alumni", "Alumni"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-semibold ${
                role === value
                  ? "border-primary bg-primary-tint text-primary"
                  : "border-line text-muted hover:border-primary"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          defaultValue={state.values?.firstName}
          required
          errors={state.fieldErrors?.firstName}
        />
        <Field
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          defaultValue={state.values?.lastName}
          required
          errors={state.fieldErrors?.lastName}
        />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        required
        errors={state.fieldErrors?.email}
        hint={
          role === "student"
            ? "Use your school email to be approved right away. Other emails are reviewed by an admin."
            : "Alumni are reviewed by an admin before joining the directory."
        }
      />
      <Field
        label="Class year"
        name="classYear"
        type="number"
        inputMode="numeric"
        placeholder="2027"
        defaultValue={state.values?.classYear}
        required
        errors={state.fieldErrors?.classYear}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={10}
        required
        hint="At least 10 characters."
        errors={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending}>Create account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
