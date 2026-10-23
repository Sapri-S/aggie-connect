# Handoff: make Aggie Connect look great on phones

Written 2026-10-23 for a fresh session. Read this file first, then
`web/README.md` and `docs/PLAN-2.0.md`.

## The goal

Most Aggies will open this on a phone. Make every page feel like a
well-built mobile app at **375 px wide** (iPhone SE/mini) and **390–430 px**
(current iPhones and Androids), in **light and dark mode**, without making
desktop worse.

## What the app is

- **Aggie Connect:** a network for **North Carolina A&T** students and
  alumni (the Aggies). It is *not* Texas A&M; don't use maroon or "Howdy".
- **Code:** `web/`, built on Next.js **16.4** (App Router, Cache Components on)
  with React 19, Tailwind **v4**, and Supabase (Auth, Postgres with RLS,
  Storage).
- **Repo:** `C:\Users\sapri\WebstormProjects\portfolio-website\aggie-connect`
  (`github.com/Sapri-S/aggie-connect`, public). **Every push to `main`
  deploys to Vercel**, so work on a branch and open a PR.
- **Live:** Vercel Hobby, free. Ask the user for the `.vercel.app` URL.

## Pages, and what they look like on a phone today

Signed-out pages were checked at 375 px: no horizontal scroll, and inputs
are 16 px, so iOS doesn't zoom on focus. Keep that. Signed-in pages
**haven't been looked at on a phone yet**. Their likely issues below come
from reading the code.

| Route | File | Known or likely issues |
| --- | --- | --- |
| Header (all pages) | `src/components/site-header.tsx` | **Signed-in nav overflows.** The logo plus Network (with badge), Profile, Admin and Sign out need about 400 px on a 375 px screen. Links are about 28–32 px tall, under the 44 px tap target. |
| `/` landing | `src/app/page.tsx` | Fine. Could tighten the hero padding and size the CTAs for thumbs. |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | `src/app/(auth)/…` | Fine. Check the student/alumni toggle and long hint text at 375 px. |
| `/home` | `src/app/home/page.tsx` | The identity card (sidebar) stacks **above** the feed on mobile and pushes content down. It could become a compact row. The "Newest Aggies" cards are one column. |
| `/u/[id]` profile | `src/app/u/[id]/page.tsx` | The avatar and the Connect controls share one row (`-mt-14 flex justify-between`). "Accept / Ignore" and the remove-confirm text will squeeze or wrap badly. |
| `/profile/edit` | `src/app/profile/edit/*` | Mostly responsive. Check the avatar block and that the Save button isn't lost at the bottom of a long form. |
| `/network` | `src/app/network/page.tsx` | Rows already stack (`flex-col sm:flex-row`). Check button alignment, which is right-aligned on its own line. |
| `/admin` | `src/app/admin/*` | Member rows have many badges and a long "email · joined · last sign-in" line, plus long confirm text. The filter tabs wrap. |
| Footer | `src/app/layout.tsx` | The disclaimer is about 109 px tall on mobile. Make it smaller and quieter. |

## Recommended direction

1. **A bottom tab bar on phones** (below `sm`), already planned in
   `docs/PLAN-2.0.md`: Home · Network (with badge) · Profile · More
   (Admin, Sign out). Keep a slim top bar with the logo. Use
   `env(safe-area-inset-bottom)` padding so it clears the iPhone home
   indicator, and add bottom padding to `<main>` so content isn't hidden
   behind it.
2. **Tap targets of at least 44×44 px** for every link and button on mobile.
3. **Profile header:** on phones, put the avatar and name first and the
   Connect controls full-width under them. Make "Accept" and "Ignore" equal
   width.
4. **Home:** turn the identity card into a compact row (avatar, name, class
   chip, Edit) on phones.
5. **Admin:** on phones, show each member as a card. Put actions in a row
   or a "⋯" menu, and the confirm text on its own line.
6. **Browser chrome:** add `viewport.themeColor` (Aggie Blue `#004684`, plus
   a dark variant) through Next's `viewport` export in `layout.tsx`, and a
   web app manifest (`app/manifest.ts`) so "Add to Home Screen" uses the
   blue-and-gold icon. `app/apple-icon.tsx` already exists.
7. **Footer:** smaller text and less padding on phones.

## Design tokens (don't invent new colors)

These are in `src/app/globals.css`, exposed as Tailwind classes:
- `bg-primary`, `text-primary`, `bg-primary-tint`, `hover:bg-primary-hover`, `text-on-primary`
- `bg-gold`, `text-on-gold`. Gold is for accents only and never for text on white, because it fails contrast.
- `bg-surface` (cards), `bg-canvas` (page), `text-ink`, `text-muted`, `border-line`, `text-danger`, `text-success`
- `bg-brand`: always Aggie Blue `#004684`, for the hero and banners.

Fonts: Montserrat for headings (`font-heading`) and Open Sans for body.
Dark mode follows `prefers-color-scheme`.

## Rules for this codebase (each was learned the hard way)

- **Next 16 is newer than your training data.** Read the bundled docs in
  `web/node_modules/next/dist/docs/` before using an API. Middleware is
  `src/proxy.ts`.
- **Cache Components is on.** Anything that reads cookies, the session,
  `params` or `searchParams` must render inside `<Suspense>`. Follow the
  existing pattern: a page component wraps an async inner component.
- **`createClient()` in `src/lib/supabase/server.ts` calls `await connection()`
  first.** Keep it, or Supabase's `Date.now()` breaks prerendering.
- **Security is enforced in the database.** UI changes must not move checks
  out of Server Actions or RLS. Never use `SUPABASE_SECRET_KEY` outside
  `src/lib/supabase/admin.ts`.
- **Windows and PowerShell 5.1.** `&&` doesn't work; use `;`. For commit
  messages with quotes, write the message to a file and run
  `git commit -F file`.
- **Port 3000** is where Supabase's email links point. If you start a
  preview server, stop it when you're done; the user runs `npm run dev`
  there.
- **Never commit `web/.env.local`.**

## Running and checking

```bash
cd web
npm install
npm run dev
```

- Check with the browser pane at the **mobile** preset (375×812) and at
  about 414 px, in light and dark mode. Measure, don't eyeball:
  `document.documentElement.scrollWidth === innerWidth` (no sideways
  scroll), and button heights of at least 44 px.
- **Signed-in pages need a session.** Ask the user to sign in themselves in
  the browser pane. Don't type their password. They're an approved admin, so
  `/admin` works too. Demo members (14 fictional people) give the home,
  profile and network pages content.
- Before committing, run `npm run lint`, `npx tsc --noEmit` and
  `npm run build`. All three pass today.

## Done when

- [x] No horizontal scroll on any page at 375 px.
- [x] Signed-in navigation fits and is thumb-reachable: a bottom tab bar on
      phones, the current header on desktop.
- [x] All tap targets are at least 44 px on mobile.
- [x] Profile, network and admin rows look intentional at 375 px, including
      the Connect states (Connect, Request sent, Accept/Ignore, Connected,
      remove confirm).
- [x] Theme color and manifest are added, and the home-screen icon works.
- [x] Light and dark mode are both checked, and desktop is unchanged or better.
- [x] Lint, typecheck and build pass, the work is on a branch with a PR, and
      before/after screenshots are described in the PR.

## Out of scope

Messaging, the directory with search and filters, and email/SMTP setup are
separate milestones in `docs/PLAN-2.0.md`.
