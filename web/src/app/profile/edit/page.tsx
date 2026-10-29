import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signAvatarUrls } from "@/lib/avatars";
import { createClient } from "@/lib/supabase/server";
import { AvatarForm } from "./avatar-form";
import { DeleteAccountForm } from "./delete-account-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <EditProfile />
      </Suspense>
    </div>
  );
}

async function EditProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  const { data: p, error } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, class_year, headline, job_title, company, major, city, bio, linkedin_url, avatar_path, open_to",
    )
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`Couldn't load your profile (${error.code}: ${error.message})`);

  const urls = await signAvatarUrls(supabase, [p.avatar_path]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Edit your profile</h1>
        <Link
          href={`/u/${user.id}`}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline sm:min-h-0"
        >
          View profile
        </Link>
      </div>

      <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
        <AvatarForm
          url={p.avatar_path ? (urls.get(p.avatar_path) ?? null) : null}
          firstName={p.first_name}
          lastName={p.last_name}
        />
      </section>

      <section className="rounded-xl border border-line bg-surface p-4 pb-0 sm:p-6">
        <ProfileForm
          initial={{
            firstName: p.first_name ?? "",
            lastName: p.last_name ?? "",
            classYear: p.class_year ? String(p.class_year) : "",
            headline: p.headline ?? "",
            jobTitle: p.job_title ?? "",
            company: p.company ?? "",
            major: p.major ?? "",
            city: p.city ?? "",
            bio: p.bio ?? "",
            linkedinUrl: p.linkedin_url ?? "",
            openTo: (p.open_to ?? []).join(","),
          }}
        />
      </section>

      <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
        <DeleteAccountForm />
      </section>
    </div>
  );
}
