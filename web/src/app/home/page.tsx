import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectButton } from "@/components/connect-button";
import { EditIcon, ExternalIcon, HelpIcon, KeyIcon, PeopleIcon, SearchIcon } from "@/components/icons";
import { signAvatarUrls } from "@/lib/avatars";
import { NCAT_NEWS, newsDate } from "@/lib/ncat-news";
import { CONTACT_EMAIL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

const PERSON_FIELDS = "id, first_name, last_name, class_year, headline, job_title, company, city, avatar_path, open_to";

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  class_year: number | null;
  headline: string | null;
  job_title: string | null;
  company: string | null;
  city: string | null;
  avatar_path: string | null;
  open_to: string[] | null;
};

const shortYear = (year: number | null) => (year ? `'${String(year).slice(-2)}` : "");
const work = (p: { job_title: string | null; company: string | null }) =>
  [p.job_title, p.company].filter(Boolean).join(" at ");

export default function HomePage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-2xl px-4 py-8 text-muted">Loading…</p>}>
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
  const myId = user.id;

  const [{ data: me }, { data: rows }, { data: newest }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, role, status, class_year, headline, job_title, company, avatar_path")
      .eq("id", myId)
      .single(),
    // RLS returns only connections you're part of.
    supabase
      .from("connections")
      .select("id, requester_id, receiver_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    // RLS returns only approved members, and only to approved members, so
    // a pending or suspended account gets an empty list here.
    supabase
      .from("profiles")
      .select(PERSON_FIELDS)
      .neq("id", myId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.rpc("has_admin_role"),
  ]);

  const other = (r: { requester_id: string; receiver_id: string }) =>
    r.requester_id === myId ? r.receiver_id : r.requester_id;
  const invitations = (rows ?? []).filter((r) => r.receiver_id === myId && r.status === "pending").slice(0, 5);
  const connected = (rows ?? []).filter((r) => r.status === "accepted");

  // People to meet: anyone you have no connection row with at all (any
  // status, either direction), people open to helping first, then newest.
  const known = new Set((rows ?? []).map(other));
  const toMeet = ((newest ?? []) as Person[])
    .filter((p) => !known.has(p.id))
    .sort((a, b) => Number((b.open_to?.length ?? 0) > 0) - Number((a.open_to?.length ?? 0) > 0))
    .slice(0, 5);

  const listedIds = [...invitations.map(other), ...connected.slice(0, 8).map(other)];
  const { data: listed } = listedIds.length
    ? await supabase.from("profiles").select(PERSON_FIELDS).in("id", listedIds)
    : { data: [] as Person[] };
  const byId = new Map(((listed ?? []) as Person[]).map((p) => [p.id, p]));

  const urls = await signAvatarUrls(supabase, [
    me?.avatar_path,
    ...toMeet.map((p) => p.avatar_path),
    ...((listed ?? []) as Person[]).map((p) => p.avatar_path),
  ]);
  const avatar = (p: { avatar_path: string | null }) => (p.avatar_path ? (urls.get(p.avatar_path) ?? null) : null);

  const profileHref = `/u/${myId}`;
  const approved = me?.status === "approved";
  const profileEmpty = me && !me.headline && !work(me) && !me.avatar_path;

  const invitationsCard = invitations.length > 0 && (
    <SideCard title="Invitations" action={<Link href="/network">See all</Link>}>
      <ul className="divide-y divide-line">
        {invitations.map((r) => {
          const p = byId.get(other(r));
          if (!p) return null;
          return (
            <li key={r.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
              <PersonLink person={p} url={avatar(p)} />
              <ConnectButton otherId={p.id} firstName={p.first_name} state={{ kind: "incoming", id: r.id }} />
            </li>
          );
        })}
      </ul>
    </SideCard>
  );

  const peopleCard = approved && toMeet.length > 0 && (
    <SideCard title="People to meet" action={<Link href="/directory">See everyone</Link>}>
      <ul className="divide-y divide-line">
        {toMeet.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
            <PersonLink person={p} url={avatar(p)} className="min-w-0 flex-1" />
            <ConnectButton otherId={p.id} firstName={p.first_name} state={{ kind: "none" }} compact />
          </li>
        ))}
      </ul>
    </SideCard>
  );

  return (
    <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_18.75rem] lg:gap-6 xl:grid-cols-[17.5rem_minmax(0,1fr)_18.75rem]">
      {/* Left: shortcuts, wide screens only (phones and tablets have the
          top bar, tab bar and account menu). */}
      <aside className="hidden xl:block">
        <nav aria-label="Shortcuts" className="sticky top-18 space-y-0.5">
          <Shortcut href={profileHref} icon={<Avatar url={me?.avatar_path ? (urls.get(me.avatar_path) ?? null) : null} firstName={me?.first_name} lastName={me?.last_name} size="xs" />}>
            {me?.first_name} {me?.last_name}
          </Shortcut>
          <Shortcut href="/directory" icon={<ShortcutIcon><SearchIcon className="h-5 w-5" /></ShortcutIcon>}>
            Directory
          </Shortcut>
          <Shortcut href="/network" icon={<ShortcutIcon><PeopleIcon className="h-5 w-5" /></ShortcutIcon>}>
            My network
          </Shortcut>
          <Shortcut href="/directory?help=any" icon={<ShortcutIcon><HelpIcon className="h-5 w-5" /></ShortcutIcon>}>
            Open to helping
          </Shortcut>
          <Shortcut href="/profile/edit" icon={<ShortcutIcon><EditIcon className="h-5 w-5" /></ShortcutIcon>}>
            Edit profile
          </Shortcut>
          {isAdmin && (
            <Shortcut href="/admin" icon={<ShortcutIcon><KeyIcon className="h-5 w-5" /></ShortcutIcon>}>
              Admin
            </Shortcut>
          )}
          <hr className="mx-2 my-3 border-line" />
          <p className="flex flex-wrap gap-x-2 gap-y-1 px-2 text-xs text-muted">
            <Link href="/privacy" className="hover:underline">Privacy</Link>·
            <Link href="/guidelines" className="hover:underline">Community guidelines</Link>
            {CONTACT_EMAIL && (
              <>
                ·<a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">Contact</a>
              </>
            )}
          </p>
          <p className="px-2 pt-1 text-xs text-muted">
            A student project, not affiliated with N.C. A&amp;T.
          </p>
        </nav>
      </aside>

      {/* Center */}
      <section aria-label="Home" className="mx-auto w-full max-w-170 space-y-4">
        {/* You: phones and tablets (wide screens show this on the left). */}
        <div className="card flex items-center gap-3 p-3 xl:hidden">
          <Avatar url={me?.avatar_path ? (urls.get(me.avatar_path) ?? null) : null} firstName={me?.first_name} lastName={me?.last_name} />
          <div className="min-w-0 flex-1">
            <Link href={profileHref} className="block truncate text-base font-semibold hover:underline">
              {me?.first_name} {me?.last_name}
              {me?.class_year && <span className="ml-1.5 font-normal text-muted">{shortYear(me.class_year)}</span>}
            </Link>
            <p className="truncate text-sm text-muted">
              {(me && work(me)) || me?.headline || (me?.role === "alumni" ? "Alumni" : "Student")}
            </p>
          </div>
          <Link href="/profile/edit" className="btn btn-secondary shrink-0 text-sm">
            Edit profile
          </Link>
        </div>

        {me?.status === "pending" && (
          <Notice>Your account isn&apos;t active yet. Confirm your email, or contact an admin if you already have.</Notice>
        )}
        {me?.status === "suspended" && (
          <Notice tone="danger">Your account is suspended. Contact an admin.</Notice>
        )}
        {approved && profileEmpty && (
          <Notice>
            Add a photo and your job so other Aggies can recognize you.{" "}
            <Link href="/profile/edit" className="font-semibold text-primary hover:underline">
              Edit profile
            </Link>
          </Notice>
        )}

        {/* On phones and tablets the right column's cards come first. */}
        {invitationsCard && <div className="lg:hidden">{invitationsCard}</div>}
        {peopleCard && <div className="lg:hidden">{peopleCard}</div>}

        <div>
          <h2 className="px-1 text-lg font-bold">News from N.C. A&amp;T</h2>
          <p className="px-1 text-sm text-muted">Recent stories from ncat.edu</p>
        </div>
        <ul className="space-y-3">
          {NCAT_NEWS.map((n) => (
            <li key={n.url}>
              <article className="card p-4">
                <header className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
                  >
                    A&amp;T
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="font-semibold">N.C. A&amp;T News</p>
                    <p className="text-xs text-muted">
                      <time dateTime={n.date}>{newsDate(n.date)}</time> · ncat.edu
                    </p>
                  </div>
                </header>
                <h3 className="mt-3 text-[1.0625rem] leading-snug font-semibold">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {n.title}
                  </a>
                </h3>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:min-h-0"
                >
                  Read on ncat.edu
                  <ExternalIcon className="h-4 w-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Right: laptops and up. */}
      <aside className="hidden space-y-4 lg:block">
        {invitationsCard}
        {peopleCard}
        <SideCard
          title="Your connections"
          action={connected.length > 0 && <Link href="/network">See all ({connected.length})</Link>}
        >
          {connected.length > 0 ? (
            <ul className="-mx-2">
              {connected.slice(0, 8).map((r) => {
                const p = byId.get(other(r));
                if (!p) return null;
                return (
                  <li key={r.id}>
                    <PersonLink person={p} url={avatar(p)} compact className="rounded-md p-2 hover:bg-surface-2" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              No connections yet. Find people in the{" "}
              <Link href="/directory" className="font-semibold text-primary hover:underline">
                directory
              </Link>
              .
            </p>
          )}
        </SideCard>
      </aside>
    </div>
  );
}

function SideCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-muted">{title}</h2>
        {action && <span className="text-sm font-semibold text-primary [&_a]:hover:underline">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function PersonLink({
  person: p,
  url,
  compact = false,
  className = "",
}: {
  person: Person;
  url: string | null;
  compact?: boolean;
  className?: string;
}) {
  const detail = [work(p) || p.headline, p.city].filter(Boolean).join(" · ");
  return (
    <Link href={`/u/${p.id}`} className={`group flex min-w-0 items-center gap-3 ${className}`}>
      <Avatar url={url} firstName={p.first_name} lastName={p.last_name} size={compact ? "xs" : "sm"} />
      <span className="min-w-0">
        <span className="block truncate font-semibold group-hover:underline">
          {p.first_name} {p.last_name}
          {p.class_year && <span className="ml-1 font-normal text-muted">{shortYear(p.class_year)}</span>}
        </span>
        {!compact && detail && <span className="block truncate text-sm text-muted">{detail}</span>}
      </span>
    </Link>
  );
}

function Shortcut({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-3 rounded-md px-2 font-semibold hover:bg-surface-3/60">
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

function ShortcutIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
      {children}
    </span>
  );
}

function Notice({ tone, children }: { tone?: "danger"; children: ReactNode }) {
  return (
    <p className={`card px-4 py-3 text-sm ${tone === "danger" ? "text-danger" : ""}`}>{children}</p>
  );
}
