"use client";

import { useActionState } from "react";
import { updateProfile } from "../actions";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/form-fields";
import type { FormState } from "@/lib/validation";

export type ProfileValues = {
  firstName: string;
  lastName: string;
  classYear: string;
  headline: string;
  jobTitle: string;
  company: string;
  major: string;
  city: string;
  bio: string;
  linkedinUrl: string;
};

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const v = (key: keyof ProfileValues) => state.values?.[key] ?? initial[key];
  const e = (key: keyof ProfileValues) => state.fieldErrors?.[key];

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage error={state.error} success={state.success} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" autoComplete="given-name" required defaultValue={v("firstName")} errors={e("firstName")} />
        <Field label="Last name" name="lastName" autoComplete="family-name" required defaultValue={v("lastName")} errors={e("lastName")} />
      </div>

      <Field
        label="Headline"
        name="headline"
        placeholder="Mechanical engineering '26 · Aspiring product designer"
        maxLength={120}
        defaultValue={v("headline")}
        errors={e("headline")}
      />

      <fieldset className="space-y-4 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Where you work now (optional)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Job title" name="jobTitle" autoComplete="organization-title" placeholder="Software Engineer" maxLength={100} defaultValue={v("jobTitle")} errors={e("jobTitle")} />
          <Field label="Company" name="company" autoComplete="organization" placeholder="Duke Energy" maxLength={100} defaultValue={v("company")} errors={e("company")} />
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Class year" name="classYear" type="number" inputMode="numeric" required defaultValue={v("classYear")} errors={e("classYear")} />
        <Field label="Major" name="major" placeholder="Computer Science" maxLength={80} defaultValue={v("major")} errors={e("major")} />
        <Field label="City" name="city" autoComplete="address-level2" placeholder="Greensboro, NC" maxLength={80} defaultValue={v("city")} errors={e("city")} />
      </div>

      <Field
        label="LinkedIn profile (optional)"
        name="linkedinUrl"
        type="url"
        placeholder="https://www.linkedin.com/in/your-name"
        hint="Shown as a button on your profile so Aggies can connect with you there."
        defaultValue={v("linkedinUrl")}
        errors={e("linkedinUrl")}
      />

      <TextArea
        label="About"
        name="bio"
        rows={5}
        maxLength={1000}
        placeholder="What you're working on, what you can help with, and what you're looking for."
        defaultValue={v("bio")}
        errors={e("bio")}
      />

      {/* Phones: Save stays in reach above the tab bar while scrolling the
          long form. */}
      <div className="sticky bottom-above-tabs -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:w-48 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <SubmitButton pending={pending}>Save profile</SubmitButton>
      </div>
    </form>
  );
}
