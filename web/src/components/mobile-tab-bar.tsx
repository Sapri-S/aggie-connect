"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

// Signed-in navigation on phones (below `sm`). The desktop header links are
// hidden there; globals.css pads <body> so content clears this bar.
export function MobileTabBar({
  profileHref,
  requests,
  isAdmin,
}: {
  profileHref: string;
  requests: number;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const more = useRef<HTMLDivElement>(null);
  const isProfile = pathname === profileHref || pathname.startsWith("/profile");

  return (
    <nav
      id="mobile-tabs"
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid h-(--tabbar-h) grid-cols-5">
        <Tab href="/home" label="Home" active={pathname === "/home"} icon={<HomeIcon />} />
        <Tab
          href="/directory"
          label="Directory"
          active={pathname === "/directory"}
          icon={<SearchIcon />}
        />
        <Tab
          href="/network"
          label="Network"
          active={pathname === "/network"}
          icon={<PeopleIcon />}
          badge={
            requests > 0 && (
              <span
                aria-label={`${requests} pending invitation${requests === 1 ? "" : "s"}`}
                className="absolute -top-1.5 left-1/2 ml-1.5 min-w-5 rounded-full bg-gold px-1 text-center text-xs leading-5 font-bold text-on-gold"
              >
                {requests}
              </span>
            )
          }
        />
        <Tab href={profileHref} label="Profile" active={isProfile} icon={<PersonIcon />} />
        <li>
          <button
            type="button"
            popoverTarget="more-menu"
            className={tabClass(pathname.startsWith("/admin"))}
          >
            <span className="relative">
              <MoreIcon />
            </span>
            More
          </button>
        </li>
      </ul>

      {/* Native popover: light dismiss and Escape come for free. */}
      <div
        id="more-menu"
        ref={more}
        popover="auto"
        className="inset-auto right-2 bottom-above-tabs m-0 mb-2 w-52 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-lg"
      >
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => more.current?.hidePopover()}
            className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-primary hover:bg-primary-tint"
          >
            Admin
          </Link>
        )}
        <Link
          href="/profile/edit"
          onClick={() => more.current?.hidePopover()}
          className="flex min-h-11 items-center rounded-lg px-3 hover:bg-primary-tint"
        >
          Edit profile
        </Link>
        <form action="/auth/signout" method="post">
          <button className="flex min-h-11 w-full items-center rounded-lg px-3 text-muted hover:bg-primary-tint hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

const tabClass = (active: boolean) =>
  `relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
    active
      ? "text-primary before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:rounded-b before:bg-gold"
      : "text-muted hover:text-ink"
  }`;

function Tab({
  href,
  label,
  active,
  icon,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <li>
      <Link href={href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
        <span className="relative">
          {icon}
          {badge}
        </span>
        {label}
      </Link>
    </li>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const HomeIcon = () => (
  <Icon>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9v11h5v-6h4v6h5V9" />
  </Icon>
);

const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

const PeopleIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Icon>
);

const PersonIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

const MoreIcon = () => (
  <Icon>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icon>
);
