# Launch build (code tasks)

Written 2026-10-29 to keep the launch-night code work on track. Owner tasks
(dashboards, accounts, money) are in `LAUNCH-CHECKLIST.md`.

Branch: `claude/launch-prep`. Everything ships in one PR.

## Scope for tonight

Only what real users need on day one. **Not** tonight: messaging, jobs,
events, feed, mentor matching. Build those after launch, based on what
members ask for.

| # | Task | Status |
| --- | --- | --- |
| 1 | Privacy policy page (`/privacy`) | done |
| 2 | Community guidelines page (`/guidelines`) | done |
| 3 | Footer links + "you agree to…" line on signup | done |
| 4 | Self-serve **Delete my account** (profile edit page) | done |
| 5 | **Report this profile** button + `reports` table + admin queue | done |
| 6 | **Open to helping Aggies** (mentoring, referrals, résumé reviews, coffee chats): profile checkboxes, chips on profiles, badge and filter in the directory | done |
| 7 | Landing page: stop advertising features that don't exist yet (Find a mentor, Hiring Aggies) | done |
| 7b | **Send a new confirmation link** after signup, and on sign-in when the email isn't confirmed | done |
| 8 | Lint, typecheck, build, test the migration, check pages in the browser | done |

## Database changes

One new migration: `web/supabase/migrations/20261029000000_launch.sql`.

- `profiles.open_to text[]`: what an alumnus or student is open to. Users can
  edit it on their own row.
- `reports` table with RLS: only admins can read it. Members file reports
  only through `report_member()` (approved members, not yourself, 10 a day,
  one open report per person).
- `admin_list_reports()`, `admin_resolve_report()`: admin-only, logged to
  `audit_log`.
- `delete_my_account()`: deletes the caller's own account. Admins can't use
  it (so the site never loses its last admin by accident).

## Deploy order (important)

`main` deploys straight to production, and the new code reads the new
`open_to` column. So:

1. Run `20261029000000_launch.sql` in Supabase → SQL Editor (production).
2. Then merge the PR.

Merging first would break the directory and profile pages until the
migration runs.

## Decisions made

- Contact email comes from the optional `NEXT_PUBLIC_CONTACT_EMAIL` env var,
  so no personal address is hard-coded in a public repo. Without it, pages
  point people to the Report button instead.
- Deleting an account removes the profile, connections and photos right
  away. The audit log keeps only "a member deleted their account" with the
  ID, not the email.
- Reports don't suspend anyone automatically. An admin decides, from the
  Reports queue on `/admin`.

## Progress log

- 2026-10-29: plan written.
- 2026-10-29: tasks 1–7 built. Checks: `check:rls`, lint, `tsc`, and
  `next build` pass. The migration was tested in PGlite (Postgres) with
  Supabase stubs, 20 cases: open_to edits and the CHECK, the directory filter,
  reporting (no self, no pending reporters, no direct inserts, 10/day, members
  can't read reports), aal1 vs aal2 admins, resolve + audit log, account
  deletion (cascade, no email kept, admins refused, signed-out refused).
  Public pages (privacy, guidelines, signup line, footer, landing) checked in
  the browser with no console errors.
- **Not yet checked in a browser:** profile edit (open-to checkboxes, delete
  account), the Report form, the directory filter and the admin Reports
  queue. They need the migration in a database first. After running it on
  production, click through each one once, signed in.
- 2026-10-29: PR 14 merged; the launch migration is in production.
- 2026-10-29: **launching without email** (owner's call). Branch
  `claude/email-off`: signup signs people straight in (to Edit profile with
  a welcome banner) when Supabase confirmation is off; forgot password,
  "send a new link" and invites hide until `NEXT_PUBLIC_EMAIL_ENABLED=true`;
  optional Turnstile CAPTCHA on sign-in, sign-up and the email forms, on
  once `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. Steps in `EMAIL-SETUP.md`.
