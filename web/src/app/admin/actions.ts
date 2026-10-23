"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { echoValues, type FormState } from "@/lib/validation";

export type ActionResult = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURRENT_YEAR = new Date().getFullYear();

// Every action re-checks admin rights on the server. The database functions
// check again, so a non-admin calling these directly gets nowhere.
async function adminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, me: null };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, me: isAdmin ? user.id : null };
}

export async function setMemberStatus(
  target: string,
  status: "approved" | "suspended",
): Promise<ActionResult> {
  if (typeof target !== "string" || !UUID.test(target)) return { error: "Unknown member." };
  if (status !== "approved" && status !== "suspended") return { error: "Unknown status." };

  const { supabase, me } = await adminSession();
  if (!me) return { error: "Only admins can do that." };
  if (me === target) return { error: "You can't change your own status." };

  const { error } = await supabase.rpc("admin_set_status", {
    target,
    new_status: status,
  });
  if (error) {
    console.error("admin_set_status failed", error.code);
    return { error: "Couldn't update that member. Try again." };
  }

  revalidatePath("/admin");
  return {};
}

export async function removeMember(target: string): Promise<ActionResult> {
  if (typeof target !== "string" || !UUID.test(target)) return { error: "Unknown member." };

  const { supabase, me } = await adminSession();
  if (!me) return { error: "Only admins can do that." };
  if (me === target) return { error: "You can't remove yourself." };

  // Delete their photo first; the profile row that points to it goes away
  // with the account.
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", target)
    .maybeSingle();
  if (profile?.avatar_path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }

  const { error } = await supabase.rpc("admin_remove_user", { target });
  if (error) {
    console.error("admin_remove_user failed", error.code);
    return { error: "Couldn't remove that member. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/home");
  return {};
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  firstName: z.string().trim().min(1, "First name is required.").max(50),
  lastName: z.string().trim().min(1, "Last name is required.").max(50),
  role: z.enum(["student", "alumni"], { message: "Choose student or alumni." }),
  classYear: z.coerce
    .number()
    .int()
    .min(1891, "NC A&T was founded in 1891.")
    .max(CURRENT_YEAR + 6, "Enter a graduation year."),
});

export async function inviteMember(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, me } = await adminSession();
  if (!me) return { values, error: "Only admins can invite people." };

  const admin = createAdminClient();
  if (!admin) {
    return {
      values,
      error: "Inviting isn't set up yet: add SUPABASE_SECRET_KEY to the server's environment.",
    };
  }

  const { email, firstName, lastName, role, classYear } = parsed.data;
  const origin = (await headers()).get("origin") ?? "";

  // Same metadata as self sign-up, so the sign-up trigger builds the profile.
  // The link takes them to "choose a password".
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { first_name: firstName, last_name: lastName, role, class_year: classYear },
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    if (error.code === "email_exists" || error.status === 422) {
      return { values, fieldErrors: { email: ["That email already has an account."] } };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { values, error: "Too many emails sent right now. Try again in a few minutes." };
    }
    console.error("inviteUserByEmail failed", error.code ?? error.name);
    return { values, error: "Couldn't send the invite. Try again." };
  }

  // Someone an admin invited doesn't need approving. This goes through the
  // admin's own session, so it's checked and written to the audit log.
  await supabase.rpc("admin_set_status", { target: data.user.id, new_status: "approved" });

  revalidatePath("/admin");
  return { success: `Invite sent to ${email}. They'll choose a password from the email.` };
}
