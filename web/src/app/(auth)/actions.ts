"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  echoValues,
  loginSchema,
  safeNext,
  signupSchema,
  type FormState,
} from "@/lib/validation";

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { values, error: "Confirm your email first. Check your inbox for the link." };
    }
    // One message for every other failure, so the form doesn't reveal
    // which emails have accounts.
    return { values, error: "Invalid email or password." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, firstName, lastName, role, classYear } = parsed.data;
  const origin = (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      // Read by the handle_new_user trigger. It ignores anything else, so a
      // user can't make themselves an admin by adding fields here.
      data: {
        first_name: firstName,
        last_name: lastName,
        role,
        class_year: classYear,
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { values, fieldErrors: { password: [error.message] } };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { values, error: "Too many sign-ups right now. Try again in a few minutes." };
    }
    console.error("signUp failed", error.code ?? error.name);
    return { values, error: "Couldn't create your account. Try again." };
  }

  // Same message whether or not the email already had an account.
  return {
    success: `Check ${email} for a confirmation link to finish signing up.`,
  };
}
