"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HomeIcon, MenuIcon, PeopleIcon, PersonIcon, SearchIcon } from "@/components/icons";

type Tab = {
  href: string;
  label: string;
  icon: (filled: boolean) => ReactNode;
  active: (pathname: string) => boolean;
};

const MAIN_TABS: Tab[] = [
  { href: "/home", label: "Home", icon: (f) => <HomeIcon filled={f} />, active: (p) => p === "/home" },
  {
    href: "/directory",
    label: "Directory",
    icon: (f) => <SearchIcon filled={f} />,
    active: (p) => p === "/directory",
  },
  {
    href: "/network",
    label: "Network",
    icon: (f) => <PeopleIcon filled={f} />,
    active: (p) => p === "/network",
  },
];

function Badge({ count, className }: { count: number; className: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} pending invitation${count === 1 ? "" : "s"}`}
      className={`absolute min-w-5 rounded-full bg-gold px-1 text-center text-xs leading-5 font-bold text-on-gold ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Center tabs in the top bar, tablet and up. Icon only, with the name as a
// tooltip and for screen readers; the active one has a blue bar under it.
export function HeaderTabs({ requests }: { requests: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden h-full sm:flex">
      <ul className="flex h-full">
        {MAIN_TABS.map((t) => {
          const active = t.active(pathname);
          return (
            <li key={t.href} className="h-full">
              <Link
                href={t.href}
                title={t.label}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full w-20 items-center justify-center lg:w-28 ${
                  active
                    ? "text-primary after:absolute after:inset-x-1 after:bottom-0 after:h-[3px] after:rounded-t after:bg-primary"
                    : "text-muted"
                }`}
              >
                <span
                  className={`relative flex h-11 w-full items-center justify-center rounded-md ${
                    active ? "" : "hover:bg-surface-2"
                  }`}
                >
                  {t.icon(active)}
                  {t.href === "/network" && <Badge count={requests} className="top-1 left-1/2 ml-1" />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Signed-in navigation on phones (below `sm`). globals.css pads <body> so
// content clears this bar. "Menu" opens the same account menu as the
// avatar button in the top bar.
export function MobileTabBar({ profileHref, requests }: { profileHref: string; requests: number }) {
  const pathname = usePathname();
  const tabs: Tab[] = [
    ...MAIN_TABS,
    {
      href: profileHref,
      label: "Profile",
      icon: (f) => <PersonIcon filled={f} />,
      active: (p) => p === profileHref || p.startsWith("/profile"),
    },
  ];

  return (
    <nav
      id="mobile-tabs"
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid h-(--tabbar-h) grid-cols-5">
        {tabs.map((t) => {
          const active = t.active(pathname);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined} className={mobileTabClass(active)}>
                <span className="relative">
                  {t.icon(active)}
                  {t.href === "/network" && <Badge count={requests} className="-top-1.5 left-1/2 ml-1.5" />}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" popoverTarget="account-menu" className={mobileTabClass(false)}>
            <MenuIcon />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}

const mobileTabClass = (active: boolean) =>
  `relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
    active
      ? "text-primary before:absolute before:inset-x-4 before:top-0 before:h-[3px] before:rounded-b before:bg-primary"
      : "text-muted hover:text-ink"
  }`;
