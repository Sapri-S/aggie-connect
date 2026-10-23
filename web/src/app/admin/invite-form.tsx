"use client";

import { useActionState, useState } from "react";
import { inviteMember } from "./actions";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

export function InviteForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(inviteMember, {});
  const [role, setRole] = useState<"student" | "alumni">("alumni");
  const v = (k: string) => state.values?.[k];

  if (!enabled) {
    return (
      <p className="text-sm text-muted">
        Inviting by email needs the Supabase secret key on the server. Add{" "}
        <code className="rounded bg-primary-tint px-1">SUPABASE_SECRET_KEY</code> to{" "}
        <code className="rounded bg-primary-tint px-1">web/.env.local</code> and to Vercel&apos;s
        environment variables (see the README), then restart.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate key={state.success}>
      <FormMessage error={state.error} success={state.success} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" required defaultValue={v("firstName")} errors={state.fieldErrors?.firstName} />
        <Field label="Last name" name="lastName" required defaultValue={v("lastName")} errors={state.fieldErrors?.lastName} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <Field label="Email" name="email" type="email" required defaultValue={v("email")} errors={state.fieldErrors?.email} />
        <div>
          <label htmlFor="invite-role" className="block text-sm font-semibold">
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "alumni")}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          >
            <option value="alumni">Alumni</option>
            <option value="student">Student</option>
          </select>
        </div>
        <Field label="Class year" name="classYear" type="number" inputMode="numeric" required defaultValue={v("classYear")} errors={state.fieldErrors?.classYear} />
      </div>
      <p className="text-xs text-muted">
        They get an email to choose a password and are approved automatically.
      </p>
      <div className="sm:w-48">
        <SubmitButton pending={pending}>Send invite</SubmitButton>
      </div>
    </form>
  );
}
