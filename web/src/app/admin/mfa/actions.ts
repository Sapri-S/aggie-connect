"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Enrolment = { factorId: string; qrCode: string; secret: string } | { error: string };

// Only admins set up MFA here. has_admin_role() ignores the MFA level on
// purpose: this is how an admin gets to aal2 in the first place.
async function adminWithoutMfa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false };
  const { data: hasRole } = await supabase.rpc("has_admin_role");
  return { supabase, ok: hasRole === true };
}

export async function startEnrolment(): Promise<Enrolment> {
  const { supabase, ok } = await adminWithoutMfa();
  if (!ok) return { error: "Only admins can do that." };

  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { error: "Couldn't start setup. Try again." };
  // Once a factor is verified, replacing it needs that factor (or the SQL
  // reset in 20261026000000_admin_mfa.sql), not just a password.
  if (factors.totp.length > 0) return { error: "Two-factor is already set up." };

  // Clear out setups that were started but never confirmed.
  for (const f of factors.all) {
    if (f.factor_type === "totp" && f.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Aggie Connect",
  });
  if (error?.code === "mfa_totp_enroll_not_enabled") {
    return { error: "Authenticator apps are turned off. Turn on TOTP in Supabase → Authentication → Multi-Factor." };
  }
  if (error) {
    console.error("mfa.enroll failed", error.code ?? error.name);
    return { error: "Couldn't start setup. Try again." };
  }
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const factorId = formData.get("factorId");
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (typeof factorId !== "string" || !UUID.test(factorId)) {
    return { error: "Start setup again." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { fieldErrors: { code: ["Enter the 6-digit code from your app."] } };
  }

  const { supabase, ok } = await adminWithoutMfa();
  if (!ok) return { error: "Only admins can do that." };

  // Supabase checks the factor belongs to this user. On success it upgrades
  // the session to aal2 and the new tokens are written to the cookies.
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    if (error.code === "mfa_verification_failed" || error.code === "mfa_challenge_expired") {
      return { fieldErrors: { code: ["That code didn't work. Wait for a new one and try again."] } };
    }
    if (error.code === "over_request_rate_limit") {
      return { error: "Too many tries. Wait a few minutes and try again." };
    }
    console.error("mfa.challengeAndVerify failed", error.code ?? error.name);
    return { error: "Couldn't check that code. Try again." };
  }

  redirect("/admin");
}
