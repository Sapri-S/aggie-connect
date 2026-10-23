import Link from "next/link";
import type { ReactNode } from "react";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { pendingRequestCount } from "@/lib/connections";
import { createClient } from "@/lib/supabase/server";

// Links are 44px tall on phones (thumb-sized) and compact from `sm` up.
const link = "inline-flex min-h-11 items-center rounded-md px-3 sm:min-h-0 sm:py-1.5";

function HeaderFrame({ home, children }: { home: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={home}
          className="inline-flex min-h-11 items-center font-heading text-lg font-bold tracking-tight text-primary"
        >
          Aggie Connect
        </Link>
        {children}
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
  const [requests, { data: isAdmin }] = user
    ? await Promise.all([
        pendingRequestCount(supabase, user.id),
        supabase.rpc("is_admin"),
      ])
    : [0, { data: false }];

  if (!user) {
    return (
      <HeaderFrame home="/">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/login" className={`${link} text-ink hover:bg-primary-tint`}>
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`${link} bg-primary font-semibold text-on-primary hover:bg-primary-hover`}
          >
            Join
          </Link>
        </nav>
      </HeaderFrame>
    );
  }

  return (
    <>
      <HeaderFrame home="/home">
        {/* Phones use the bottom tab bar instead. */}
        <nav aria-label="Main" className="hidden items-center gap-2 text-sm sm:flex">
          <Link
            href="/network"
            className="relative rounded-md px-3 py-1.5 text-ink hover:bg-primary-tint"
          >
            Network
            {requests > 0 && (
              <span
                aria-label={`${requests} pending invitation${requests === 1 ? "" : "s"}`}
                className="ml-1 rounded-full bg-gold px-1.5 py-0.5 text-xs font-bold text-on-gold"
              >
                {requests}
              </span>
            )}
          </Link>
          <Link
            href={`/u/${user.id}`}
            className="rounded-md px-3 py-1.5 text-ink hover:bg-primary-tint"
          >
            Profile
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 font-semibold text-primary hover:bg-primary-tint"
            >
              Admin
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="rounded-md px-3 py-1.5 text-muted hover:bg-primary-tint hover:text-ink">
              Sign out
            </button>
          </form>
        </nav>
      </HeaderFrame>
      <MobileTabBar profileHref={`/u/${user.id}`} requests={requests} isAdmin={Boolean(isAdmin)} />
    </>
  );
}
