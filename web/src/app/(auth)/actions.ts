"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  echoValues,
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  safeNext,
  signupSchema,
  type FormState,
} from "@/lib/validation";

// The Turnstile widget adds this field to the form. Supabase verifies it when
// CAPTCHA is on (Authentication → Attack Protection) and ignores it otherwise.
function captchaToken(formData: FormData) {
  const token = formData.get("cf-turnstile-response");
  return typeof token === "string" && token ? token : undefined;
}

const CAPTCHA_ERROR = "Complete the \"I'm human\" check and try again.";

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
    captchaToken: captchaToken(formData),
  });

  if (error?.code === "captcha_failed") return { values, error: CAPTCHA_ERROR };
  if (error?.code === "over_email_send_rate_limit") {
    return { values, error: "Too many requests right now. Try again in a few minutes." };
  }
  if (error) console.error("resetPasswordForEmail failed", error.code ?? error.name);

  // Same message whether or not the email has an account, so this form
  // can't be used to find out who's a member.
  return {
    success: `If ${parsed.data.email} has an account, we've sent it a link to reset your password.`,
  };
}

// Sends a fresh sign-up confirmation link, for when the first one was lost,
// landed in spam or expired. Supabase also allows only one per address per
// minute.
export async function resendConfirmation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/confirm`, captchaToken: captchaToken(formData) },
  });

  if (error?.code === "captcha_failed") return { error: CAPTCHA_ERROR };
  if (error?.code === "over_email_send_rate_limit" || error?.status === 429) {
    return { error: "We just sent one. Wait a minute, then try again." };
  }
  if (error) console.error("resend confirmation failed", error.code ?? error.name);

  // Same message whether or not the email has an unconfirmed account.
  return {
    success: `If ${parsed.data.email} is waiting to be confirmed, a new link is on its way. Check your spam folder too.`,
  };
}

export async function setNewPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { fieldErrors: { password: ["Choose a password you haven't used here before."] } };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: [error.message] } };
    }
    console.error("updateUser password failed", error.code ?? error.name);
    return { error: "Couldn't update your password. Try again." };
  }

  redirect("/home");
}

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
  const { error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: { captchaToken: captchaToken(formData) },
  });

  if (error) {
    if (error.code === "captcha_failed") return { values, error: CAPTCHA_ERROR };
    if (error.code === "email_not_confirmed") {
      return {
        values,
        unconfirmed: true,
        error: "Confirm your email first. Check your inbox (and spam) for the link.",
      };
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      captchaToken: captchaToken(formData),
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
    if (error.code === "captcha_failed") return { values, error: CAPTCHA_ERROR };
    // Only reported when email confirmation is off; with it on, Supabase
    // answers the same as for a new address.
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { values, fieldErrors: { email: ["That email already has an account. Sign in instead."] } };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { values, error: "Too many sign-ups right now. Try again in a few minutes." };
    }
    console.error("signUp failed", error.code ?? error.name);
    return { values, error: "Couldn't create your account. Try again." };
  }

  // With email confirmation off in Supabase, the new member is signed in
  // (and approved by the database) right away: send them to fill in their
  // profile.
  if (data.session) redirect("/profile/edit?welcome=1");

  // Same message whether or not the email already had an account.
  return {
    values: { email },
    success: `Check ${email} for a confirmation link to finish signing up.`,
  };
}
