# Aggie Connect 2.0 — Plan

Written 2026-10-22. Revised the same day: 2.0 moves from Vite + Express +
Sequelize to **Next.js + Supabase (Auth, Postgres with RLS, Storage)**.

> **Do not push this file to the public repo while the issues in "What 1.x got
> wrong" might still apply to a running deployment.**

2.0 has three goals:

1. **Security by construction.** Auth, sessions and access control come from
   Supabase and the database, not hand-written middleware.
2. **A big leap in UI.** Borrow what works in LinkedIn, Handshake, PeopleGrove
   and Hivebrite, and make it unmistakably Aggie.
3. **A network, not a directory.** Mentorship, messaging, a feed, jobs, events.

---

## Status of the 1.x leak (Phase 0)

- `server/.env` and `dbpass` were committed to the public repo. They are now
  untracked and ignored (commit `0273f38` on `plan/v2`).
- The leaked database password and Supabase service key belonged to project
  `xwdfkfsupzakrdpboynm`. **That project no longer exists**: its hostname no
  longer resolves, and the pooler rejects the login with "tenant/user not found",
  so those credentials are dead.
- `JWT_SECRET` and `SESSION_SECRET` were replaced locally.
- **Still to do:** rotate the LinkedIn client secret, then purge the files from
  git history with `git filter-repo` (or make the repo private).
- 2.0 uses Supabase project `pyrkfkadqhlgmetqghvx`.

---

## Stack

| Layer | 1.x | 2.0 |
| --- | --- | --- |
| Frontend | Vite + React 19 SPA | **Next.js 16 App Router** (React 19, Server Components) |
| API | Express controllers | Server Components for reads, **Server Actions** for writes, Route Handlers only where needed |
| Auth | bcrypt + 7-day JWT in `localStorage` | **Supabase Auth**, with sessions in httpOnly cookies via `@supabase/ssr` |
| Access control | `req.user.id !== Number(id)` checks in each controller | **Postgres Row Level Security** on every table |
| Database | Sequelize, `sync()` | Supabase Postgres + SQL migrations in `supabase/migrations/` |
| Files | Multer + service-key upload | Supabase Storage with per-user path policies |
| Styling | Tailwind 3, blue/gold | **Tailwind 4**, CSS-variable tokens, maroon, dark mode |
| Hosting | Separate client + Node server | Vercel (free tier) + Supabase (free tier) |

The new app lives in `web/` next to the old code. `client/` and `server/` are
deleted once every page has a replacement.

**Free-tier note:** a free Supabase project pauses after 7 days without
activity, and a long-paused project can be deleted. That is very likely what
happened to the 1.x database. Before real users arrive, either move to Pro
($25/mo) or keep a scheduled health ping, and take regular `pg_dump` backups
either way.

---

## What 1.x got wrong, and how 2.0 closes each one

These are the problems found in the 1.x code. Each one maps to a structural fix
in 2.0, not a patch.

| # | 1.x problem | 2.0 answer |
| --- | --- | --- |
| S1 | Anyone could register and then read every member's email. `isApproved` was never checked. | Directory reads go through the `public_profiles` view, which has no email column. RLS lets **only verified and approved** users see other profiles. |
| S2 | No proof a user is an Aggie. | Supabase email confirmation is required. Students must use `@tamu.edu`. Former students go through admin approval (see Open questions). |
| S3 | The first registrant became admin. | `role` is set only by admins or by SQL. RLS blocks users from changing their own `role` or `status`. |
| S4 | Validation and the login rate limiter were written but never wired in. | Supabase Auth rate-limits sign-in and sign-up. Server Actions validate every input with **zod**. |
| S5 | `linkedInUrl` was rendered as a link without validation. | zod plus a database `CHECK` constraint allow only `https://(www.)linkedin.com/in/…`. |
| S6 | The admin middleware called a method that doesn't exist. | Admin pages check `role = 'admin'` on the server, and RLS enforces it again in the database. |
| S7 | 7-day tokens in `localStorage`, impossible to revoke. | Short access tokens and refresh tokens in httpOnly cookies. Sign-out revokes the session. |
| S8 | 500 errors sent raw database messages to the client. | Server Actions return typed results. Unknown errors are logged on the server and the client gets a generic message. |
| S9 | Uploads trusted the client's MIME type and file extension. | Fixed avatar path per user, `image/*` MIME allow-list and size limit on the bucket, and re-encoding with `sharp` in a Server Action. |
| S10 | TLS to Postgres didn't verify the certificate. | Gone. The app talks to Supabase over HTTPS, with no direct `pg` connection. |
| S11 | The directory was unpaginated and easy to scrape. | Paginated queries (25 per page) and search through a Postgres function with a row limit. |
| S12 | Admin edit wrote any field. | Admin actions are narrow functions (approve, reject, set role), each written to `audit_log`. |

### Rules that keep it secure

- **The service-role key never reaches the browser** and is not used in request handlers. It's only for admin scripts and migrations. Request handling uses the user's own session, so RLS always applies.
- **Every table has RLS enabled in the migration that creates it.** No exceptions, and CI fails if one doesn't.
- **Use `supabase.auth.getUser()` (verified with the server) for authorization, never `getSession()`.**
- Set a CSP header, keep secrets only in `.env.local` and Vercel, and enable GitHub secret scanning with push protection.
- Optional TOTP 2FA (Supabase MFA), required for admins.

---

## UI: the big leap

### Colors

1.x used blue `#004F9F` and gold, which are not Texas A&M colors. Aggie Maroon
is **`#500000`** (Pantone 7421), and white is its partner color.

| Token | Light | Dark |
| --- | --- | --- |
| `--maroon` (primary) | `#500000` | `#B04A4A` |
| `--maroon-hover` | `#732F2F` | `#C66262` |
| `--maroon-tint` | `#F7EDED` | `#2A1414` |
| `--surface` | `#FFFFFF` | `#181313` |
| `--canvas` | `#F6F4F2` | `#0F0B0B` |
| `--ink` | `#1F1A1A` | `#F2ECEC` |
| `--muted` | `#6B6262` | `#A89E9E` |
| `--line` | `#E7E1DE` | `#2E2626` |

Headings use **Montserrat** and body text uses **Open Sans**. Dark mode follows
the system setting.

### What to borrow, and from whom

| Pattern | From | Aggie version |
| --- | --- | --- |
| Three-column home: identity card, feed, suggestions | LinkedIn | Identity card with a **Class of '27** chip, major and ring badge. The suggestions rail shows "Aggies near you". |
| Banner, overlapping avatar, experience timeline | LinkedIn | Maroon banner. The timeline includes A&M orgs: Corps, MSC, Fish Camp, Big Event. |
| Mentor matching with goals and "why this match" | PeopleGrove | **Find a Mentor**: pick goals, get ranked former students, request an intro in one click. |
| Faceted directory, map view | Hivebrite / Almabase | Filter by class year, college, major, industry, city, Corps or org. |
| Jobs posted by alumni, referral requests | Handshake | **Hiring Aggies** board. |
| Events with RSVP | Hivebrite | Muster, Ring Day, local A&M Club events. |
| Lightweight feed | LinkedIn / Fishbowl | **Howdy board**, with a "Gig 'em" reaction. |
| Ctrl+K command palette | Modern SaaS | Search people, jobs and events from anywhere. |

### Aggie theming: tasteful, not costume

- "Howdy, {firstName}". "Former students" rather than "alumni". The class year goes next to every name, as in "Jane Doe '19".
- Ring and Corps badges, plus friendly empty states ("Lost on West Campus?").
- **Branding caution:** "Aggie Network" is the name of the Association of Former Students' app, and the A&M marks are trademarked. Keep the name **Aggie Connect** and don't use official logos without permission.

### Components

- **shadcn/ui** (Radix primitives), themed with the tokens above.
- **lucide-react** icons.
- Mobile-first, with a bottom tab bar on phones (Home, Network, Mentors, Jobs, Me).
- WCAG AA contrast, visible focus rings, and full keyboard navigation.

### Page map

```
/                    Landing (signed out)
/login  /signup      Supabase Auth, email confirmation required
/auth/confirm        Email-link handler
/onboarding          Role, class year, major, city: completes the profile
/pending             Shown until an admin approves (former students)
/home                Feed + identity card + suggestions
/network             Connections, requests, suggestions
/directory           Faceted search + map
/mentors  /jobs  /events  /messages
/u/[id]              Profile
/settings            Account · Privacy · Security · Notifications
/admin               Approvals, users, reports queue, audit log
```

---

## Data model (Supabase)

The first migration (`web/supabase/migrations/…_init.sql`) creates:

- `profiles`: one row per `auth.users` row, created by a trigger on sign-up.
  Columns: `role` (student, former_student, admin), `status` (pending,
  approved, suspended), `class_year`, `major`, `college`, `city`, `headline`,
  `bio`, `linkedin_url` (with a CHECK constraint), `avatar_path`, `orgs[]`,
  `is_corps`, `ring_year`.
- `public_profiles`: a view without private columns, which the directory reads.
- `connections`: a requester and a receiver, a status, and a unique pair.
- `audit_log`: admin actions.
- RLS policies for all of the above. A user can edit only their own profile,
  and only non-privileged columns.

Later migrations add `mentor_profiles`, `mentorships`, `conversations`,
`messages`, `posts`, `comments`, `reactions`, `jobs`, `events`, `rsvps`,
`reports` and `notifications`. Each ships with its RLS policies and an RLS test.

---

## Milestones

| Milestone | Contents | Exit criteria |
| --- | --- | --- |
| **M0 Foundations** | `web/` scaffold, maroon tokens, Supabase SSR clients, proxy session refresh, login, signup, email confirmation, sign-out, init migration with RLS | `npm run build` passes. A new user can't read any profile until confirmed and approved. |
| **M1 Profiles** | Onboarding, profile page, edit profile, avatar upload, admin approvals | Admin approves a pending user. Profile edits can't change `role` or `status`. |
| **M2 Directory + network** | Faceted search, pagination, connections | Emails never appear in a directory response. |
| **M3 Mentorship + messaging** | Matching, intros, 1:1 messages (Realtime) | Messaging only between connections or matched pairs. Report and block work. |
| **M4 Howdy board, jobs, events** | Feed, Hiring Aggies, events + RSVP | Moderation queue in use. |
| **M5 Cutover** | Deploy to Vercel, delete `client/` and `server/` | Old code removed, history purged, secret scanning on. |

**Testing:** Vitest for zod schemas and helpers. Playwright for the
sign-up → confirm → approve flow. **RLS tests in SQL**, run against the local
Supabase stack (`supabase start`) in CI, that act as another user and assert
reads and writes are denied.

## Open questions

1. How are former students without a working `@tamu.edu` address verified: admin approval, class year plus ring, or LinkedIn education?
2. Portfolio project or real users? Real users raise the bar: privacy policy, data deletion, possibly FERPA questions for student data, and a paid Supabase plan to avoid pausing.
3. Is official affiliation with the Association of Former Students a goal? That decides the branding.
