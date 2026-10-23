import Link from "next/link";
import type { ReactNode } from "react";
import { pendingRequestCount } from "@/lib/connections";
import { createClient } from "@/lib/supabase/server";

function HeaderFrame({ home, children }: { home: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={home}
          className="font-heading text-lg font-bold tracking-tight text-primary"
        >
          Aggie Connect
        </Link>
        <nav className="flex items-center gap-2 text-sm">{children}</nav>
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

  return (
    <HeaderFrame home={user ? "/home" : "/"}>
      {user ? (
        <>
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
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-ink hover:bg-primary-tint"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-3 py-1.5 font-semibold text-on-primary hover:bg-primary-hover"
          >
            Join
          </Link>
        </>
      )}
    </HeaderFrame>
  );
}
