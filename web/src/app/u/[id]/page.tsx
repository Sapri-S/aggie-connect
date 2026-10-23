import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectButton } from "@/components/connect-button";
import { signAvatarUrls } from "@/lib/avatars";
import { connectionWith } from "@/lib/connections";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  alumni: "Alumni",
  admin: "Admin",
};

export default function ProfilePage({ params }: PageProps<"/u/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}

async function Profile({ params }: Pick<PageProps<"/u/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/u/${id}`);

  // RLS returns nothing unless this is your own profile, or you're approved
  // and they're approved, so a hidden profile looks the same as a missing one.
  const { data: p, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, role, class_year, headline, job_title, company, major, city, bio, linkedin_url, avatar_path",
    )
    .eq("id", id)
    .maybeSingle();
  // A query error (say, a migration that hasn't been run) is not the same as
  // a hidden profile; surface it instead of showing a misleading 404.
  if (error) throw new Error(`Couldn't load profile (${error.code}: ${error.message})`);
  if (!p) notFound();

  const isMe = p.id === user.id;
  const [urls, connection] = await Promise.all([
    signAvatarUrls(supabase, [p.avatar_path]),
    isMe ? null : connectionWith(supabase, user.id, p.id),
  ]);
  const work = [p.job_title, p.company].filter(Boolean).join(" at ");

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-28 border-b-4 border-gold bg-brand sm:h-36" />
      <div className="px-6 pb-6">
        <div className="-mt-14 flex items-end justify-between gap-3">
          <Avatar
            url={p.avatar_path ? urls.get(p.avatar_path) : null}
            firstName={p.first_name}
            lastName={p.last_name}
            size="lg"
            className="border-4 border-surface"
          />
          {isMe ? (
            <Link
              href="/profile/edit"
              className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold hover:bg-primary-tint"
            >
              Edit profile
            </Link>
          ) : (
            connection && (
              <ConnectButton otherId={p.id} firstName={p.first_name} state={connection} />
            )
          )}
        </div>

        <h1 className="mt-3 text-2xl font-extrabold">
          {p.first_name} {p.last_name}
          {p.class_year && (
            <span className="ml-2 align-middle rounded-full bg-gold px-2 py-0.5 text-sm font-semibold text-on-gold">
              &apos;{String(p.class_year).slice(-2)}
            </span>
          )}
        </h1>
        {p.headline && <p className="mt-1 text-lg">{p.headline}</p>}

        <ul className="mt-3 space-y-1 text-sm text-muted">
          {work && <li>{work}</li>}
          {p.major && <li>{p.major}</li>}
          {p.city && <li>{p.city}</li>}
          <li>{ROLE_LABEL[p.role] ?? "Member"}</li>
        </ul>

        {p.linkedin_url && (
          <a
            href={p.linkedin_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
            </svg>
            View on LinkedIn
          </a>
        )}

        {p.bio && (
          <section className="mt-6">
            <h2 className="font-bold">About</h2>
            <p className="mt-2 whitespace-pre-line text-ink">{p.bio}</p>
          </section>
        )}

        {isMe && !p.headline && !work && !p.bio && (
          <p className="mt-6 rounded-md bg-primary-tint px-4 py-3 text-sm">
            Your profile is pretty empty.{" "}
            <Link href="/profile/edit" className="font-semibold text-primary hover:underline">
              Add a photo, your job and your LinkedIn
            </Link>{" "}
            so Aggies can find you.
          </p>
        )}
      </div>
    </article>
  );
}
