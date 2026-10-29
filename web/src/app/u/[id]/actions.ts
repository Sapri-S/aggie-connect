"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation";

const reportSchema = z.object({
  target: z.uuid(),
  reason: z.enum(["fake", "spam", "harassment", "inappropriate", "other"], {
    message: "Choose a reason.",
  }),
  details: z.string().trim().max(500, "Use 500 characters or fewer.").default(""),
});

// report_member() checks again in the database: approved members only, not
// yourself, at most 10 a day.
export async function reportMember(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { target, reason, details } = parsed.data;
  const { error } = await supabase.rpc("report_member", { target, reason, details });
  if (error) {
    if (error.code === "54000") {
      return { error: "You've sent a lot of reports today. Try again tomorrow." };
    }
    console.error("report_member failed", error.code);
    return { error: "Couldn't send your report. Try again." };
  }

  return { success: "Thanks. Your report went to the admins, and it's private." };
}
