"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { Avatar } from "@/components/avatar";
import { ThemeSwitch } from "@/components/theme-switch";

// The signed-in account menu: opened by the avatar in the top bar (tablet
// and up) or the "Menu" tab (phones). Native popover, so light dismiss and
// Escape come for free.
//
// Props are only what's shown here. This is a client component, so every
// prop ends up in the page source.
export function AccountMenu({
  firstName,
  lastName,
  avatarUrl,
  profileHref,
  isAdmin,
  contactEmail,
}: {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  profileHref: string;
  isAdmin: boolean;
  contactEmail: string | null;
}) {
  const menu = useRef<HTMLDivElement>(null);
  // Close after following a link (client navigation keeps the popover open).
  const closeOnLink = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) menu.current?.hidePopover();
  };

  const item = "flex min-h-11 items-center rounded-md px-3 font-semibold hover:bg-surface-2";

  return (
    <div
      id="account-menu"
      ref={menu}
      popover="auto"
      onClick={closeOnLink}
      className="inset-auto right-2 bottom-above-tabs m-0 mb-2 max-h-[calc(100dvh-8rem)] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-line bg-surface p-2 text-ink shadow-xl sm:top-14 sm:right-3 sm:bottom-auto sm:mt-1 sm:mb-0"
    >
      <Link href={profileHref} className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-2">
        <Avatar url={avatarUrl} firstName={firstName} lastName={lastName} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            {firstName} {lastName}
          </span>
          <span className="block text-sm text-muted">View your profile</span>
        </span>
      </Link>

      <hr className="my-2 border-line" />

      <Link href="/profile/edit" className={item}>
        Edit profile
      </Link>
      {isAdmin && (
        <Link href="/admin" className={`${item} text-primary`}>
          Admin
        </Link>
      )}

      <div className="px-3 py-2">
        <p className="mb-1.5 text-sm font-semibold">Display</p>
        <ThemeSwitch />
      </div>

      <form action="/auth/signout" method="post">
        <button className={`${item} w-full text-left`}>Sign out</button>
      </form>

      <hr className="my-2 border-line" />

      <nav aria-label="Site" className="flex flex-wrap gap-x-3 gap-y-1 px-3 text-xs text-muted">
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        <Link href="/guidelines" className="hover:underline">
          Community guidelines
        </Link>
        {contactEmail && (
          <a href={`mailto:${contactEmail}`} className="hover:underline">
            Contact
          </a>
        )}
      </nav>
      <p className="px-3 pt-2 pb-1 text-xs text-muted">
        A student project, not affiliated with or endorsed by N.C. A&amp;T or its alumni association.
      </p>
    </div>
  );
}
