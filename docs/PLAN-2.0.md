# Aggie Connect 2.0 — Plan

Written 2026-10-22. Revised the same day: 2.0 moves from Vite + Express +
Sequelize to **Next.js + Supabase (Auth, Postgres with RLS, Storage)**.

**Audience:** students and alumni of **North Carolina A&T State University**,
the Aggies. An earlier draft of this plan assumed Texas A&M and used maroon. That
was wrong. 1.x's blue and gold were the right idea.

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
| Styling | Tailwind 3, blue/gold | **Tailwind 4**, CSS-variable tokens, official Aggie Blue and Gold, dark mode |
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
| S1 | Anyone could register and then read every member's email. `isApproved` was never checked. | `profiles` has no email column; emails stay in `auth.users`, which clients can't read. RLS lets **only verified and approved** users see other profiles. |
| S2 | No proof a user is an Aggie. | Any email can sign up, and confirmation is required. Students who confirm an `ncat.edu` or `aggies.ncat.edu` address are approved automatically (`public.is_school_email`). Everyone else, including all alumni, waits for admin approval (see Open questions). |
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

NC A&T's palette page gives **Aggie Blue `#004684`** (PMS 288) and **Aggie
Gold `#FDB927`** (PMS 123). 1.x's `#004F9F` and `#F0AA00` were close but not
exact. The university's style guide lists slightly different values
(`#002D74`, `#FDB827`), so check with University Relations before anything
official.

Blue is the primary color. Gold is the accent: calls to action on blue,
class-year chips, and the stripe under banners. Gold is never used for text
on white, because it fails contrast.

| Token | Light | Dark |
| --- | --- | --- |
| `--primary` | `#004684` | `#6EA8E0` (lifted, with dark text on top) |
| `--primary-hover` | `#003563` | `#8DBBE8` |
| `--primary-tint` | `#E8F0F8` | `#12233A` |
| `--gold` / `--on-gold` | `#FDB927` / `#0B2440` | same |
| `--surface` | `#FFFFFF` | `#121A24` |
| `--canvas` | `#F4F6F9` | `#0B1118` |
| `--ink` | `#14202E` | `#E8EEF5` |
| `--muted` | `#5B6675` | `#9AA7B6` |
| `--line` | `#DDE3EA` | `#243142` |
| `brand` (hero, banners) | `#004684` | `#004684` |

Headings use **Montserrat** and body text uses **Open Sans**. Dark mode follows
the system setting.

### What to borrow, and from whom

| Pattern | From | Aggie version |
| --- | --- | --- |
| Three-column home: identity card, feed, suggestions | LinkedIn | Identity card with a gold **Class of '27** chip and the user's college and major. The suggestions rail shows "Aggies near you". |
| Banner, overlapping avatar, experience timeline | LinkedIn | Aggie Blue banner with a gold stripe. The timeline includes campus life: Greek life (Divine Nine chapters), ROTC, the Blue and Gold Marching Machine, SGA, NSBE, and other student orgs. |
| Mentor matching with goals and "why this match" | PeopleGrove | **Find a Mentor**: pick goals, get ranked alumni, request an intro in one click. Engineering, agriculture, nursing and business lead, matching A&T's biggest programs. |
| Faceted directory, map view | Hivebrite / Almabase | Filter by class year, college, major, industry, city and org. Alumni chapters by city: Greensboro, Charlotte, Raleigh-Durham, Atlanta, D.C., and others. |
| Jobs posted by alumni, referral requests | Handshake | **Hiring Aggies** board. |
| Events with RSVP | Hivebrite | **Homecoming (GHOE)** meetups and tailgates, chapter events, career fairs, and watch parties. |
| Lightweight feed | LinkedIn / Fishbowl | **Aggie Pride board** for wins, asks and job leads, with an "Aggie Pride!" reaction. |
| Ctrl+K command palette | Modern SaaS | Search people, jobs and events from anywhere. |

### Aggie theming: tasteful, not costume

- "Aggie Pride, {firstName}!" as the greeting. "Aggie Pride!" is the call-and-response every Aggie knows.
- The class year goes next to every name, as in "Jane Doe '19", on a gold chip.
- HBCU pride and history in the details: a nod to the A&T Four and the 1960 Greensboro sit-ins on the About page, and GHOE countdowns in the fall.
- Optional badges: chapter (Greek life), ROTC, Marching Machine alum, legacy Aggie.
- Friendly empty states ("Nobody here yet. Bring your Aggie Pride!").
- **Branding caution:** A&T's logos, the Aggie Dog mark and the "Aggies Do" tagline belong to the university. Keep the name **Aggie Connect**, use the colors and the culture, and don't use official marks or imply endorsement without permission. The footer already says the site isn't affiliated.

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
/pending             Shown until an admin approves (alumni, non-school emails)
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

Migrations in `web/supabase/migrations/`, run in order:

1. `…000000_init.sql`: tables, RLS, triggers and admin functions.
2. `…010000_any_email_signup.sql`: any email can sign up; adds
   `public.is_school_email()` with the NC A&T domains.
3. `…020000_nc_at.sql`: renames the `former_student` role to `alumni`, sets
   class years to start at 1891 (when A&T was founded), and drops the Texas
   A&M-specific `is_corps` column.

Together they create:

- `profiles`: one row per `auth.users` row, created by a trigger on sign-up.
  Columns: `role` (student, alumni, admin), `status` (pending, approved,
  suspended), `class_year`, `major`, `college`, `city`, `headline`, `bio`,
  `linkedin_url` (with a CHECK constraint), `avatar_path`, `orgs[]`,
  `ring_year`. There is no email column.
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
| **M0 Foundations** | `web/` scaffold, Aggie Blue and Gold tokens, Supabase SSR clients, proxy session refresh, login, signup, email confirmation, sign-out, init migration with RLS | `npm run build` passes. A new user can't read any profile until confirmed and approved. |
| **M1 Profiles** | Onboarding, profile page, edit profile, avatar upload, admin approvals | Admin approves a pending user. Profile edits can't change `role` or `status`. |
| **M2 Directory + network** | Faceted search, pagination, connections | Emails never appear in a directory response. |
| **M3 Mentorship + messaging** | Matching, intros, 1:1 messages (Realtime) | Messaging only between connections or matched pairs. Report and block work. |
| **M4 Aggie Pride board, jobs, events** | Feed, Hiring Aggies, events + RSVP | Moderation queue in use. |
| **M5 Cutover** | Deploy to Vercel, delete `client/` and `server/` | Old code removed, history purged, secret scanning on. |

**Testing:** Vitest for zod schemas and helpers. Playwright for the
sign-up → confirm → approve flow. **RLS tests in SQL**, run against the local
Supabase stack (`supabase start`) in CI, that act as another user and assert
reads and writes are denied.

## Before inviting real users

Reminders for things deliberately skipped during development:

- [ ] **Custom SMTP for auth emails.** Supabase's built-in sender only
      delivers to members of your Supabase organization, and only a few emails
      an hour. Real users won't get confirmation emails until this is set up.
      Recommended: Resend (free tier, needs a domain you own) through
      Supabase → Authentication → Emails → SMTP Settings.
- [ ] Rotate the LinkedIn client secret, and purge `server/.env` and `dbpass`
      from git history.
- [ ] Set the Supabase Site URL and redirect URLs to the production domain.
- [ ] Decide on the Supabase plan: free projects pause after 7 days without
      activity.

## Open questions

1. How are alumni verified? Right now an admin approves each one. Options to make that easier: a lifetime `aggies.ncat.edu` address if A&T gives one to alumni, LinkedIn education, or a class year plus a referral from an approved Aggie.
2. Portfolio project or real users? Real users raise the bar: privacy policy, data deletion, possibly FERPA questions for student data, and a paid Supabase plan to avoid pausing.
3. Is official affiliation with NC A&T or its National Alumni Association a goal? That decides whether official marks can be used.
