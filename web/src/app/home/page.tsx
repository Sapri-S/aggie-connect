import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { signAvatarUrls } from "@/lib/avatars";
import { pendingRequestCount } from "@/lib/connections";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

const shortYear = (year: number | null) =>
  year ? `'${String(year).slice(-2)}` : "";

export default function HomePage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-6xl px-4 py-8 text-muted">Loading…</p>}
    >
      <Home />
    </Suspense>
  );
}

async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/home");

  const { data: me } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, status, class_year, major, city, job_title, company, avatar_path")
    .eq("id", user.id)
    .single();

  // RLS returns only approved members, and only to approved members,
  // so a pending user gets an empty list here.
  const { data: aggies } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, class_year, headline, job_title, company, city, avatar_path")
    .neq("id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const invitations = await pendingRequestCount(supabase, user.id);
  const urls = await signAvatarUrls(supabase, [
    me?.avatar_path,
    ...(aggies ?? []).map((a) => a.avatar_path),
  ]);
  const work = (p: { job_title: string | null; company: string | null }) =>
    [p.job_title, p.company].filter(Boolean).join(" at ");

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 sm:gap-6 sm:py-8 lg:grid-cols-[280px_1fr]">
      {/* Phones: a compact row (avatar, name, class, Edit). Desktop: a card
          with the blue-and-gold banner. */}
      <aside className="h-fit overflow-hidden rounded-xl border border-line border-l-4 border-l-gold bg-surface lg:border-l lg:border-l-line">
        <div className="hidden h-16 border-b-4 border-gold bg-brand lg:block" />
        <div className="relative flex items-center gap-3 p-3 lg:static lg:block lg:px-5 lg:pt-0 lg:pb-5">
          <Avatar
            url={me?.avatar_path ? urls.get(me.avatar_path) : null}
            firstName={me?.first_name}
            lastName={me?.last_name}
            className="lg:-mt-8 lg:border-4 lg:border-surface"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${user.id}`}
              className="block truncate font-heading font-bold after:absolute after:inset-0 hover:underline lg:mt-2 lg:text-lg lg:after:hidden"
            >
              {me?.first_name} {me?.last_name}
            </Link>
            {me && work(me) && <p className="truncate text-sm text-muted">{work(me)}</p>}
            <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
              {me?.class_year && (
                <span className="rounded-full bg-gold px-2 py-0.5 font-semibold text-on-gold">
                  Class of {shortYear(me.class_year)}
                </span>
              )}
              <span className="rounded-full border border-line px-2 py-0.5 text-muted">
                {me?.role === "alumni" ? "Alumni" : me?.role === "admin" ? "Admin" : "Student"}
              </span>
            </div>
          </div>
          <Link
            href="/profile/edit"
            aria-label="Edit profile"
            className="relative inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-line px-3 text-sm font-semibold hover:bg-primary-tint lg:mt-4 lg:flex lg:min-h-0 lg:py-1.5"
          >
            <span className="lg:hidden">Edit</span>
            <span className="hidden lg:inline">Edit profile</span>
          </Link>
        </div>
      </aside>

      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold">Aggie Pride, {me?.first_name ?? "Aggie"}!</h1>
          {me?.status === "pending" && (
            <p className="mt-3 rounded-md border border-line bg-primary-tint px-4 py-3 text-sm">
              Your account isn&apos;t active yet. Confirm your email, or contact an
              admin if you already have.
            </p>
          )}
          {me?.status === "suspended" && (
            <p className="mt-3 rounded-md border border-line bg-primary-tint px-4 py-3 text-sm text-danger">
              Your account is suspended. Contact an admin.
            </p>
          )}
          {invitations > 0 && (
            <Link
              href="/network"
              className="mt-3 flex items-center justify-between rounded-md border border-gold bg-surface px-4 py-3 text-sm hover:bg-primary-tint"
            >
              <span>
                You have <strong>{invitations}</strong> connection{" "}
                {invitations === 1 ? "invitation" : "invitations"} waiting.
              </span>
              <span className="font-semibold text-primary">Review</span>
            </Link>
          )}
        </div>

        {me?.status === "approved" && (
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h2 className="font-bold">Newest Aggies</h2>
            {aggies && aggies.length > 0 ? (
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {aggies.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/u/${a.id}`}
                      className="flex items-center gap-3 rounded-lg border border-line p-3 hover:border-primary"
                    >
                      <Avatar
                        url={a.avatar_path ? urls.get(a.avatar_path) : null}
                        firstName={a.first_name}
                        lastName={a.last_name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {a.first_name} {a.last_name}{" "}
                          <span className="text-primary">{shortYear(a.class_year)}</span>
                        </p>
                        <p className="truncate text-sm text-muted">
                          {[work(a) || a.headline, a.city].filter(Boolean).join(" · ") ||
                            "New to Aggie Connect"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                You&apos;re one of the first. Invite your fellow Aggies!
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
