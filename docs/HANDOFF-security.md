# Handoff: security and vulnerability management

Written 2026-10-23 for a fresh session, and updated the same day after
PRs #6 and #7 landed. Read this file first, then `web/README.md` and the
security sections of `docs/PLAN-2.0.md` ("What 1.x got wrong" and "Rules
that keep it secure").

## The goal

Get Aggie Connect ready for **real NC A&T students and alumni**, then keep it
that way: close the gaps below in priority order, and set up a routine that
catches new vulnerabilities (dependencies, Supabase settings, leaked secrets)
before users are affected.

## What the app is

- **Aggie Connect:** a network for **North Carolina A&T** students and
  alumni. Not Texas A&M.
- **Code:** `web/`, Next.js **16.4.2** (App Router, Cache Components,
  middleware in `src/proxy.ts`), React 19, Supabase Auth + Postgres with RLS
  + Storage, deployed on Vercel Hobby.
- **Repo:** `github.com/Sapri-S/aggie-connect`, **public**. Every push to
  `main` deploys to production at **https://aggie-connect.vercel.app**.
  Vercel builds only `web/` (root directory `web`).
- **Supabase project:** `pyrkfkadqhlgmetqghvx` (Free plan).
- `client/` and `server/` are the old 1.x app. They are **not deployed**, but
  they are still in the repo (see P2).

## Threat model in one paragraph

The data worth protecting is members' names, class years, jobs, employers,
cities, bios and photos (a list of HBCU students and alumni), plus their
emails, which only admins can see. The likely attackers are scrapers and
spammers, people impersonating Aggies, and anyone holding a leaked key. The
publishable key is public by design, so **RLS is the access control**: a
member can call the Supabase API directly with their own session and get
anything RLS allows, not just what the UI shows.

## What's in place (verified 2026-10-23)

| Control | Where | Checked how |
| --- | --- | --- |
| RLS on every table (`profiles`, `connections`, `audit_log`, `connection_request_log`) | `web/supabase/migrations/` | `npm run check:rls`, also in CI |
| Emails never in `profiles`; only admins see them, through `admin_list_members()` | `init.sql`, `20261023000000_admin.sql` | Schema read |
| Users can't change their own `role` or `status` (column grants plus admin-only functions) | `init.sql` | Grants read |
| Admin actions logged to `audit_log` (set status, set role, remove) | `init.sql`, `admin.sql` | `insert into public.audit_log` in each function |
| **Admins need TOTP two-factor.** `is_admin()` requires an `aal2` session, so every admin policy and function does too. `/admin` sends admins without it to `/admin/mfa` | `20261026000000_admin_mfa.sql`, `src/app/admin/mfa/` | On production: an `aal1` admin session was sent to `/admin/mfa`; after enrolling, the session was `aal2` and `/admin` loaded. Also tested in Postgres (PGlite) |
| **Connection request limits:** 30 per rolling 24 hours, 100 pending, in a trigger | `20261025000000_connection_limits.sql` | Tested in Postgres (PGlite): 31st refused, withdraw-and-resend still counts, resets after 24 hours |
| **CI** on every PR and push to `main`: RLS check, lint, `next typegen` + `tsc`, build, `npm audit --omit=dev --audit-level=high` | `.github/workflows/ci.yml` | Passed on PR #6 and on `main` after the merges |
| **Dependabot config:** npm in `/web` and GitHub Actions, weekly; `next` and `eslint-config-next` grouped | `.github/dependabot.yml` | File read. Alerts and security updates are still **off** (P1 #7) |
| **CSP, report-only:** static policy (nonces don't work with Partial Prerendering), inline scripts allowed, everything else `'self'` plus the Supabase origin for avatars | `web/next.config.ts` | Header served on production. No violations on `/home`, `/directory`, `/network`, `/profile/edit`, `/admin` in a local production build |
| Authorization uses `getUser()`, never `getSession()` | `web/src` | `grep getSession` returns nothing |
| Secret key server-only, only behind an admin check, only for invites | `web/src/lib/supabase/admin.ts`, `src/app/admin/actions.ts` | Only 2 call sites. The admin check now also requires `aal2` |
| Avatar uploads: private bucket, size and MIME limits, re-encoded with `sharp`, `limitInputPixels` | `20261022030000_profile_fields.sql`, `src/app/profile/actions.ts` | Code read |
| zod on every Server Action; LinkedIn URL also a DB `CHECK` | `src/lib/validation.ts`, `init.sql` | Code read |
| Security headers: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy; `poweredByHeader: false` | `web/next.config.ts` | Config read; framing blocked in a browser test |
| Session cookies via `@supabase/ssr`, refreshed in `src/proxy.ts` | `src/lib/supabase/proxy.ts` | Code read |
| GitHub secret scanning **and push protection on** | Repo settings | `gh api repos/Sapri-S/aggie-connect` |
| `.env*`, `dbpass`, `*.pem`, `*.key` ignored; no real env file tracked | `.gitignore` | `git ls-files` |
| Production deps: **0 known vulnerabilities** | `web/` | `npm audit --omit=dev`, also in CI |
| Supabase Site URL `https://aggie-connect.vercel.app`; redirects allow only `/auth/confirm` on prod and localhost | Supabase → Auth → URL Configuration | Dashboard |

## Gaps, in priority order

### P0: before inviting real users

1. **Email sender.** Supabase's built-in SMTP sends **2 emails/hour** and
   **only to Supabase team members**. Everyone else never gets a
   confirmation link, so they can't get in. Set up custom SMTP (Resend needs
   a domain the user owns; Brevo works from a single verified address but
   lands in spam more). Then raise Auth → Rate Limits → emails/hour.
   *This needs the user: accounts, domain purchase and API keys are theirs.*
2. **Server-side password and signup rules.** The 10-character minimum is
   only in zod. Anyone can call Supabase Auth's `signUp` directly with the
   public key and skip it. In Supabase → Auth → Providers → Email, set
   **minimum password length 10** and require letters and digits. Consider
   **CAPTCHA** (Auth → Attack Protection → Turnstile), since signup is open
   and auto-approved.
3. **Scraping through the API.** Since PR #3, **everyone who confirms an
   email is approved**, and approved members can read every approved profile.
   The directory UI pages 24 at a time (PR #4), but a member can query
   `profiles` directly and get up to Supabase's **API max rows (1000 by
   default)** per request. Options, pick one with the user:
   - Lower Settings → API → **Max rows** (for example to 100). First check
     that `admin_list_members()` and `/admin` still work with more members
     than that, and paginate them if not.
   - Or move directory reads behind a `security definer` RPC with a hard
     `limit`, and drop the "approved members read approved members" select
     policy in favour of narrower ones. This is a bigger change.
   - And/or go back to auto-approving only school emails
     (`public.is_school_email`). The header comment of
     `20261024000000_auto_approve.sql` says how.
4. **Protect `main`.** There's still no ruleset (`gh api
   repos/Sapri-S/aggie-connect/rulesets` returns none), and `main` deploys
   straight to production. CI now exists, so add a ruleset: require a PR,
   require the **`web`** check, block force-pushes and deletion.
5. **Delete the demo members** with `web/supabase/seed/remove_demo_accounts.sql`
   if that hasn't been done. It deletes only `@demo.aggieconnect.invalid`
   accounts. Check with a `select` first.

### P1: soon after launch

6. ~~**CI.**~~ **Done** in PR #6. Still to do: make it required (P0 #4).
7. **Dependabot.** `.github/dependabot.yml` is in (PR #6). Still **off**:
   Dependabot alerts and security updates (Settings → Code security). The
   user turns these on. `next` and `eslint-config-next` are pinned exactly,
   so read the release notes before merging the grouped `nextjs` PR. Watch
   https://github.com/vercel/next.js/security/advisories.
8. **Content-Security-Policy.** Report-only since PR #6. Nonces don't work
   with Partial Prerendering (see Next's CSP guide), so it allows
   `'unsafe-inline'` scripts; it still blocks other origins, framing,
   plugins, `<base>` and off-site form posts. To finish: watch production for
   violations for a while, then rename the header to
   `Content-Security-Policy` and add `upgrade-insecure-requests` (ignored in
   report-only, so it was left out).
9. ~~**Admin MFA.**~~ **Done** in PR #7 and enrolled on production. A lost
   authenticator is reset with SQL (see "If something leaks").
10. **Abuse limits.** Connection requests are capped in the database
    (PR #6). Other Server Actions (profile edits, avatar uploads) still have
    no limits beyond Supabase's own. Add database limits the same way if
    abuse shows up.
11. **Supabase Security Advisor.** Run Database → Advisors (security and
    performance) and fix what it flags. Re-run after every migration. Not
    run yet after #6 and #7.

### P2: cleanup and hardening

12. **Remove `client/` and `server/`** (milestone M5). Their lockfiles have
    **35 known vulnerabilities (1 critical, 23 high)**. They aren't deployed,
    but they're public code that someone might run. Also consider purging
    the old leaked `server/.env`/`dbpass` from git history. Those credentials
    are dead because the old project is deleted (see `PLAN-2.0.md` Phase 0),
    so this is hygiene, not an emergency.
13. **Dev-only advisories:** 5 high via `eslint-config-next` →
    `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. These
    don't ship to users. Fix by bumping `eslint-config-next` when a release
    resolves it. Don't use `npm audit fix --force`.
14. **Account deletion and privacy.** There's no way for members to delete
    their own account or export their data, and no privacy policy. Both are
    needed for real users (see Open questions 2 in `PLAN-2.0.md`, including
    FERPA).
15. **Backups.** The Free plan has daily backups only, no point-in-time
    recovery, and pauses after inactivity. Decide whether real users justify
    the Pro plan, which also adds leaked-password protection.

## The routine (vulnerability management)

| When | What | Where results land |
| --- | --- | --- |
| Every PR | CI: RLS check, lint, typecheck, build, `npm audit --omit=dev` | PR checks |
| Continuously | Dependabot alerts and PRs (once turned on); secret scanning with push protection | GitHub → Security tab, email |
| Weekly | Merge Dependabot PRs after CI passes. Check Next.js and Supabase advisories | — |
| After each migration | Run it in the SQL Editor, confirm it applied (see below), then the Supabase Security Advisor | Supabase dashboard |
| Monthly | Review `audit_log` for unexpected admin actions; review Auth → Users for spam signups; check the browser console on production for CSP reports | — |
| Quarterly | Rotate the Supabase secret key; re-read this file and update the "verified" table | — |

**Fix-by targets:** critical within 24 hours, high within 7 days, moderate
within 30 days, low at the next routine update. A vulnerability counts only
if the affected code ships to users (`npm audit --omit=dev`); dev-only issues
wait for the routine.

## If something leaks

1. **Secret key** (`SUPABASE_SECRET_KEY`): in Supabase → Settings → API
   Keys, create a new secret key and delete the old one. Update it in
   Vercel (Settings → Environment Variables) and `web/.env.local`, then
   redeploy.
2. **Publishable key:** it's public by design. If it's being abused,
   rotate it the same way and redeploy.
3. **A member's account:** suspend it from `/admin`. RLS then hides it and
   stops it reading anyone else, even with a still-valid session. If the
   account itself is compromised, send a password reset from Supabase →
   Auth → Users, or remove it from `/admin`.
4. **An admin's password:** without their authenticator it gets only a
   member session. Reset the password anyway. If the authenticator is lost
   or compromised, delete their factors in the SQL Editor and have them
   enrol again at `/admin/mfa`:
   ```sql
   delete from auth.mfa_factors
   where user_id = (select id from auth.users where email = 'admin@example.com');
   ```
5. **Data exposure through RLS:** fix the policy in a new migration, run it,
   and check `audit_log` and the Supabase API logs for what was read. Tell
   affected members.
6. Write down what happened and add a check to CI so it can't happen again.

## Rules for this codebase (each learned the hard way)

- **Security lives in the database and Server Actions, never only in the
  UI.** Anything the UI hides, RLS must also deny. Test with direct API calls,
  not just the page.
- **Admin rights go through `public.is_admin()`, which requires `aal2`.**
  `has_admin_role()` ignores MFA and is only for routing (the Admin link,
  sending admins to `/admin/mfa`). Never use it to grant access.
- **Next 16 is newer than your training data.** Read
  `web/node_modules/next/dist/docs/` before using an API.
- **Cache Components is on.** Anything reading cookies, session, `params`
  or `searchParams` renders inside `<Suspense>`. `createClient()` calls
  `await connection()` first; keep it.
- **`SUPABASE_SECRET_KEY` only in `src/lib/supabase/admin.ts`**, never
  `NEXT_PUBLIC_`, and only after an admin check.
- **Migrations aren't applied by deploys.** The user runs each new file in
  the Supabase SQL Editor. Say so in every PR that adds one, add it to the
  numbered list in `web/README.md`, and **confirm it applied** afterwards.
  Merging #6 and #7 left production on the old schema until both were run;
  a `to_regprocedure(...)`/`to_regclass(...)` check in the SQL Editor showed
  it. Merge first, then run the migration.
- **Test migrations before the PR.** Docker may not be running. PGlite
  (`@electric-sql/pglite`, in a scratch folder) runs real Postgres in Node:
  stub `auth.uid()`, `auth.jwt()` (from `request.jwt.claims`), `auth.users`
  and `storage`, apply every migration in order, then act as
  `authenticated` with `set local role` and claims.
- **The lockfile must work with `npm ci` on Linux.** `npm install` on
  Windows can leave out Linux-only optional packages. If CI's `npm ci`
  fails with "Missing … from lock file", regenerate the lockfile from
  `package.json` in an empty folder and check the version diff.
- **Supabase dashboard changes, purchases, account sign-ups and API keys
  belong to the user.** Ask before changing settings; never type passwords
  or keys, or enrol MFA on their account.
- **Windows and PowerShell 5.1:** no `&&`. Commit with `git commit -F file`.
  Port 3000 is the user's dev server; previews from a worktree use another
  port (3001), started from that worktree. Stop any server you start, and
  check its child process is gone too.
- **Never commit `web/.env.local`.** Never push to `main`; open a PR.

## Docs that are out of date

Fix these in `docs/PLAN-2.0.md` as the gaps close:
- S11, "search through a Postgres function with a row limit": the directory
  (PR #4) uses PostgREST filters with sanitized input and `range()`, not a
  function (see P0 #3).

## Done when

- [ ] P0 items 1–5 done, or explicitly accepted by the user.
- [ ] CI runs on every PR ✅ and is required on `main` (P0 #4).
- [ ] Dependabot alerts and security updates are on (`dependabot.yml` ✅).
- [ ] CSP enforced, with no violations on any page in light or dark mode
  (report-only ✅).
- [x] Admins need TOTP to reach `/admin`.
- [ ] Supabase Security Advisor shows no errors.
- [ ] `client/` and `server/` are removed.
- [ ] The "verified" table above and `PLAN-2.0.md` match reality.

## Out of scope

Messaging, mentorship, jobs and events (milestones M3 and M4) will need
their own threat review when built.
