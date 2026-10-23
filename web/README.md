# Aggie Connect 2.0 (web)

Next.js 16 + Supabase. See `../docs/PLAN-2.0.md` for the full plan.

## Setup

1. **Environment.** Copy `.env.example` to `.env.local` and fill in two values
   from Supabase → Project Settings → API Keys:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the **publishable** key (`sb_publishable_…`)

   Never put the secret/service-role key in this app.

2. **Database.** Open Supabase → SQL Editor and run each file in
   `supabase/migrations/` once, oldest first:
   1. `20261022000000_init.sql`
   2. `20261022010000_any_email_signup.sql`
   3. `20261022020000_nc_at.sql`
   4. `20261022030000_profile_fields.sql` (job title, company, avatars bucket)
   5. `20261023000000_admin.sql` (admin member list and remove)
   6. `20261024000000_auto_approve.sql` (approve everyone who confirms their email)

   You can also use the CLI: `npx supabase link --project-ref <ref>`, then
   `npx supabase db push`.

3. **Auth settings** (Supabase → Authentication):
   - **Sign In / Providers → Email:** keep "Confirm email" **on**.
   - **URL Configuration:** set the Site URL to `http://localhost:3000` (your
     Vercel URL later), and add `http://localhost:3000/auth/confirm` to the
     Redirect URLs.
   - **Emails → Confirm signup:** change the link to
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
     so confirmation works even if the link is opened in another browser.
   - **Emails → Reset password:** change the link to
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
     so the reset link signs the user in and opens the "choose a new
     password" page.
   - The built-in email sender is heavily rate-limited (a few emails per
     hour). Set up custom SMTP before real users arrive.

4. **Run it.**
   ```bash
   npm install
   npm run dev
   ```

5. **First admin.** Sign up, confirm your email, then run this in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin', status = 'approved'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   There's deliberately no way to become an admin from the app.

## Admin page

Admins see an **Admin** link in the header. `/admin` lists every member with
their email. From there an admin can approve, suspend, reactivate or remove
members, and invite people by email. Non-admins get a 404.

**Inviting** needs the Supabase **secret key**, because only Supabase Auth
can send the invite email:

1. In Supabase, go to Project Settings → API Keys, then **Secret keys**, and copy the
   `sb_secret_…` key (or the legacy `service_role` key).
2. Add `SUPABASE_SECRET_KEY=...` to `web/.env.local`, and in Vercel under
   Settings → Environment Variables. **Never** prefix it with
   `NEXT_PUBLIC_`; it must stay on the server.
3. In Supabase, go to Authentication → Emails → **Invite user** and change the link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/reset-password`.
   Admin invites don't use the browser-based (PKCE) flow, so the default link wouldn't work here.

Without the key, everything else on the admin page still works, and the
invite box explains what's missing. The key is only used in
`src/lib/supabase/admin.ts`, and only after the caller is checked to be an admin.

## Demo members

`supabase/seed/demo_accounts.sql` adds 14 fictional Aggies: 9 alumni and 5
students, with jobs, majors and cities. Run it in the SQL Editor so the home
page has people in it. The accounts can't be signed into, and every bio is
marked "(Demo profile.)". Remove them before launch with
`supabase/seed/remove_demo_accounts.sql`.

Demo members can't sign in, so they can't accept connection requests. To
see what a connection looks like, send them requests and then run
`supabase/seed/accept_demo_requests.sql`.

## Deploying

Vercel deploys automatically: every push to `main` goes live in about a
minute. Pushes to other branches get their own preview URL.

## How access works

- Anyone can sign up with any email.
- Everyone is approved as soon as they confirm their email: students and
  alumni, school or personal address. Until then they're **pending**.
- Admins can suspend or remove anyone from `/admin`. To go back to
  auto-approving only school emails (`public.is_school_email()`), see the
  comment at the top of `20261024000000_auto_approve.sql`.
- Row Level Security in the database decides what each user can read or
  write. Pending users see only their own profile. Profiles never contain
  emails. Users can't change their own `role` or `status`.
