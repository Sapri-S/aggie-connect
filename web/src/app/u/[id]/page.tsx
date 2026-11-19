import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectButton } from "@/components/connect-button";
import { BriefcaseIcon, CapIcon, EditIcon, PersonIcon, PinIcon } from "@/components/icons";
import { signAvatarUrls } from "@/lib/avatars";
import { connectionWith } from "@/lib/connections";
import { openToLabel } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { ProfileMoreMenu } from "./report-form";

export const metadata: Metadata = { title: "Profile" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  alumni: "Alumni",
  admin: "Admin",
};

type Tab = "about" | "connections";

export default function ProfilePage({ params, searchParams }: PageProps<"/u/[id]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-5xl px-4 py-8 text-muted">Loading…</p>}>
      <Profile params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Profile({ params, searchParams }: Pick<PageProps<"/u/[id]">, "params" | "searchParams">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
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
      "id, first_name, last_name, role, class_year, headline, job_title, company, major, city, bio, linkedin_url, avatar_path, open_to",
    )
    .eq("id", id)
    .maybeSingle();
  // A query error (say, a migration that hasn't been run) is not the same as
  // a hidden profile; surface it instead of showing a misleading 404.
  if (error) throw new Error(`Couldn't load profile (${error.code}: ${error.message})`);
  if (!p) notFound();

  const isMe = p.id === user.id;
  // The Connections tab only exists on your own profile: other members'
  // connections (who knows whom) aren't shown to anyone.
  const tab: Tab = isMe && sp.tab === "connections" ? "connections" : "about";

  const [urls, connection, connectionCount] = await Promise.all([
    signAvatarUrls(supabase, [p.avatar_path]),
    isMe ? null : connectionWith(supabase, user.id, p.id),
    isMe
      ? supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted")
          .then(({ count }) => count ?? 0)
      : null,
  ]);
  const work = [p.job_title, p.company].filter(Boolean).join(" at ");
  const base = `/u/${p.id}`;

  return (
    <div>
      {/* Header band: cover, photo, name, actions, tabs. */}
      <div className="border-b border-(--card-border) bg-surface shadow-(--card-shadow)">
        <div className="mx-auto max-w-5xl sm:px-4">
          <div className="h-36 bg-brand sm:h-56 sm:rounded-b-lg" />
          <div className="px-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              <Avatar
                url={p.avatar_path ? urls.get(p.avatar_path) : null}
                firstName={p.first_name}
                lastName={p.last_name}
                size="xl"
                className="-mt-16 border-4 border-surface sm:-mt-12"
              />
              <div className="min-w-0 flex-1 sm:pb-3">
                <h1 className="text-[1.75rem] leading-tight font-bold">
                  {p.first_name} {p.last_name}
                  {p.class_year && (
                    <span className="ml-2 inline-block rounded-full bg-gold px-2 py-0.5 align-middle text-sm font-semibold text-on-gold">
                      &apos;{String(p.class_year).slice(-2)}
                    </span>
                  )}
                </h1>
                {p.headline && <p className="mt-1 text-base text-muted">{p.headline}</p>}
                {isMe && (
                  <p className="mt-1 text-sm font-semibold text-muted">
                    {connectionCount} connection{connectionCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pb-4 sm:pb-3">
                {isMe ? (
                  <Link href="/profile/edit" className="btn btn-secondary flex-1 sm:flex-none">
                    <EditIcon className="h-4 w-4" />
                    Edit profile
                  </Link>
                ) : (
                  <>
                    <div className="flex-1 sm:flex-none">
                      {connection && <ConnectButton otherId={p.id} firstName={p.first_name} state={connection} />}
                    </div>
                    <ProfileMoreMenu target={p.id} firstName={p.first_name} />
                  </>
                )}
              </div>
            </div>

            {isMe && (
              <nav aria-label="Profile sections" className="flex border-t border-line">
                <TabLink href={base} active={tab === "about"}>
                  About
                </TabLink>
                <TabLink href={`${base}?tab=connections`} active={tab === "connections"}>
                  Connections
                </TabLink>
              </nav>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
        {tab === "connections" ? (
          <Suspense fallback={<p className="text-muted">Loading…</p>}>
            <MyConnections me={user.id} />
          </Suspense>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <section className="card h-fit p-4">
              <h2 className="text-lg font-bold">Intro</h2>
              <ul className="mt-3 space-y-3">
                {work && <IntroRow icon={<BriefcaseIcon className="h-5 w-5" />}>{work}</IntroRow>}
                {p.major && <IntroRow icon={<CapIcon className="h-5 w-5" />}>{p.role === "student" ? "Studies" : "Studied"} {p.major} at N.C. A&amp;T</IntroRow>}
                {p.city && <IntroRow icon={<PinIcon className="h-5 w-5" />}>Lives in {p.city}</IntroRow>}
                <IntroRow icon={<PersonIcon className="h-5 w-5" />}>
                  {ROLE_LABEL[p.role] ?? "Member"}
                  {p.class_year ? `, class of ${p.class_year}` : ""}
                </IntroRow>
              </ul>
              {p.linkedin_url && (
                <a
                  href={p.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn btn-secondary mt-4 w-full"
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                  </svg>
                  View on LinkedIn
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </section>

            <div className="space-y-4">
              {isMe && !p.headline && !work && !p.bio && (
                <p className="card px-4 py-3 text-sm">
                  Your profile is pretty empty.{" "}
                  <Link href="/profile/edit" className="font-semibold text-primary hover:underline">
                    Add a photo, your job and your LinkedIn
                  </Link>{" "}
                  so Aggies can find you.
                </p>
              )}

              {p.open_to?.length > 0 && (
                <section className="card p-4">
                  <h2 className="text-lg font-bold">Open to helping Aggies with</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {p.open_to.map((o: string) => (
                      <li key={o} className="rounded-full bg-primary-tint px-3 py-1 text-sm font-semibold text-primary">
                        {openToLabel(o)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="card p-4">
                <h2 className="text-lg font-bold">About</h2>
                {p.bio ? (
                  <p className="mt-2 whitespace-pre-line">{p.bio}</p>
                ) : (
                  <p className="mt-2 text-muted">
                    {isMe ? "Tell Aggies a little about yourself." : `${p.first_name} hasn't written anything yet.`}
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Your own connections. RLS returns only connections you're part of.
async function MyConnections({ me }: { me: string }) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id")
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
  const ids = (rows ?? []).map((r) => (r.requester_id === me ? r.receiver_id : r.requester_id));
  const { data: people } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, class_year, job_title, company, headline, avatar_path")
        .in("id", ids)
    : { data: [] };
  const urls = await signAvatarUrls(supabase, (people ?? []).map((x) => x.avatar_path));
  const byId = new Map((people ?? []).map((x) => [x.id, x]));

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Connections</h2>
        <Link href="/network" className="text-sm font-semibold text-primary hover:underline">
          Manage
        </Link>
      </div>
      {ids.length === 0 ? (
        <p className="mt-2 text-muted">
          No connections yet. Find Aggies in the{" "}
          <Link href="/directory" className="font-semibold text-primary hover:underline">
            directory
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ids.map((pid) => {
            const x = byId.get(pid);
            if (!x) return null;
            const detail = [x.job_title, x.company].filter(Boolean).join(" at ") || x.headline;
            return (
              <li key={pid}>
                <Link href={`/u/${x.id}`} className="flex items-center gap-3 rounded-lg border border-line p-3 hover:bg-surface-2">
                  <Avatar
                    url={x.avatar_path ? urls.get(x.avatar_path) : null}
                    firstName={x.first_name}
                    lastName={x.last_name}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {x.first_name} {x.last_name}
                      {x.class_year && (
                        <span className="ml-1 font-normal text-muted">&apos;{String(x.class_year).slice(-2)}</span>
                      )}
                    </span>
                    {detail && <span className="block truncate text-sm text-muted">{detail}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-12 items-center px-4 font-semibold ${
        active
          ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t after:bg-primary"
          : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function IntroRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
