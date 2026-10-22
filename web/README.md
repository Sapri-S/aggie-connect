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

## How access works

- Anyone can sign up with any email.
- Students who confirm an `ncat.edu` or `aggies.ncat.edu` email are approved
  automatically. The domain list is in `public.is_school_email()`.
- Alumni, and students who use another email, stay **pending** until an admin
  approves them.
- Row Level Security in the database decides what each user can read or
  write. Pending users see only their own profile. Profiles never contain
  emails. Users can't change their own `role` or `status`.
