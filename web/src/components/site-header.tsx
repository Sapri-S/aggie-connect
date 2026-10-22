import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

function HeaderFrame({ home, children }: { home: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={home}
          className="font-heading text-lg font-bold tracking-tight text-maroon"
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

  return (
    <HeaderFrame home={user ? "/home" : "/"}>
      {user ? (
        <form action="/auth/signout" method="post">
          <button className="rounded-md px-3 py-1.5 text-muted hover:bg-maroon-tint hover:text-ink">
            Sign out
          </button>
        </form>
      ) : (
        <>
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-ink hover:bg-maroon-tint"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-maroon px-3 py-1.5 font-semibold text-on-maroon hover:bg-maroon-hover"
          >
            Join
          </Link>
        </>
      )}
    </HeaderFrame>
  );
}
