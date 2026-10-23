import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/form-fields";
import { createClient } from "@/lib/supabase/server";
import { EnrolForm, VerifyForm } from "./mfa-forms";

export const metadata: Metadata = { title: "Two-factor authentication" };

export default function AdminMfaPage() {
  return (
    <AuthCard title="Two-factor authentication">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Mfa />
      </Suspense>
    </AuthCard>
  );
}

// /admin sends admins here until their session has passed a TOTP check
// (aal2). The database enforces the same rule in public.is_admin().
async function Mfa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/mfa");

  const { data: hasRole } = await supabase.rpc("has_admin_role");
  if (!hasRole) notFound();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect("/admin");

  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(`Couldn't load your two-factor settings (${error.code ?? error.name})`);

  const factor = factors.totp[0];
  return factor ? <VerifyForm factorId={factor.id} /> : <EnrolForm />;
}
