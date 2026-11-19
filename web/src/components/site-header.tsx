import Link from "next/link";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { Avatar } from "@/components/avatar";
import { SearchIcon } from "@/components/icons";
import { HeaderTabs, MobileTabBar } from "@/components/nav-tabs";
import { signAvatarUrls } from "@/lib/avatars";
import { pendingRequestCount } from "@/lib/connections";
import { CONTACT_EMAIL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Top bar: wordmark and search on the left, icon tabs in the middle (tablet
// and up), account menu on the right. Three equal-ish regions so the tabs
// stay centered, like most social apps.
function HeaderFrame({
  home,
  left,
  center,
  right,
}: {
  home: string;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-(--card-border) bg-surface shadow-(--card-shadow)">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href={home}
            className="inline-flex min-h-11 shrink-0 items-center text-xl font-bold tracking-tight text-primary"
          >
            Aggie Connect
          </Link>
          {left}
        </div>
        {center}
        <div className="flex flex-1 items-center justify-end gap-2">{right}</div>
      </div>
    </header>
  );
}

// Static placeholder shown while the session is read.
export function SiteHeaderShell() {
  return <HeaderFrame home="/" />;
}

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <HeaderFrame
        home="/"
        right={
          <>
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Join
            </Link>
          </>
        }
      />
    );
  }

  const [requests, { data: isAdmin }, { data: me }] = await Promise.all([
    pendingRequestCount(supabase, user.id),
    // Not is_admin(): admins still see the link before two-factor, and
    // /admin sends them to set it up.
    supabase.rpc("has_admin_role"),
    supabase.from("profiles").select("first_name, last_name, avatar_path").eq("id", user.id).maybeSingle(),
  ]);
  const urls = await signAvatarUrls(supabase, [me?.avatar_path]);
  const avatarUrl = me?.avatar_path ? (urls.get(me.avatar_path) ?? null) : null;
  const profileHref = `/u/${user.id}`;

  return (
    <>
      <HeaderFrame
        home="/home"
        left={
          <>
            {/* Laptops: a search box. Smaller screens: a search button. Both
                go to the directory, which already sanitizes and pages the
                search. No live typeahead, so the member list can't be
                scraped one keystroke at a time. */}
            <form action="/directory" role="search" className="hidden lg:block">
              <label className="flex h-10 w-60 items-center gap-2 rounded-full bg-surface-2 px-3 text-muted focus-within:outline-2 focus-within:outline-primary">
                <SearchIcon className="h-4 w-4 shrink-0" />
                <input
                  type="search"
                  name="q"
                  maxLength={80}
                  placeholder="Search Aggies"
                  aria-label="Search Aggies"
                  className="w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
                />
              </label>
            </form>
          </>
        }
        center={<HeaderTabs requests={requests} />}
        right={
          <>
            <Link
              href="/directory"
              aria-label="Search Aggies"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink hover:bg-surface-3 sm:hidden"
            >
              <SearchIcon className="h-5 w-5" />
            </Link>
            <button
              type="button"
              popoverTarget="account-menu"
              aria-label="Account menu"
              className="hidden rounded-full sm:inline-flex"
            >
              <Avatar url={avatarUrl} firstName={me?.first_name} lastName={me?.last_name} size="sm" />
            </button>
          </>
        }
      />
      <MobileTabBar profileHref={profileHref} requests={requests} />
      <AccountMenu
        firstName={me?.first_name ?? ""}
        lastName={me?.last_name ?? ""}
        avatarUrl={avatarUrl}
        profileHref={profileHref}
        isAdmin={Boolean(isAdmin)}
        contactEmail={CONTACT_EMAIL}
      />
    </>
  );
}
