# Email setup (sign-up confirmations, password resets, invites)

Written 2026-10-29 for launch. This is item 1 in `LAUNCH-CHECKLIST.md`.

> **Decision 2026-10-29: launch without email.** Email confirmation is
> turned **off** for launch, and SMTP gets set up afterward. See
> [Launch mode: no email](#launch-mode-no-email) first; the rest of this
> file is for when email gets turned on.

## Launch mode: no email

New members are signed in and approved the moment they sign up (the
database already approves anyone whose email is marked confirmed, and
Supabase marks it confirmed when confirmation is off). The site hides
everything that sends email until `NEXT_PUBLIC_EMAIL_ENABLED=true`:
"Forgot password?" becomes "ask an admin", the "send a new link" option
disappears, and `/admin` invites are replaced by "share the signup link".

**Dashboard steps (do these before launch):**

1. Supabase → Authentication → **Sign In / Providers → Email**: turn
   **Confirm email** off. Save.
2. Let in anyone who signed up earlier and is stuck waiting for a
   confirmation email. In the SQL Editor:

   ```sql
   -- Marks them confirmed; the database then approves them.
   update auth.users set email_confirmed_at = now()
   where email_confirmed_at is null;
   ```

3. Set up the CAPTCHA (`LAUNCH-CHECKLIST.md` item 3). With instant,
   auto-approved signup it's the main thing stopping bots.

**What you give up until email is on:**

- Emails aren't verified. Someone could sign up with another person's
  address. Admins remove fake accounts (the Report button helps).
- Nobody can reset their own password. An admin does it by hand:

  ```sql
  -- Pick a temporary password and tell the member through a channel you
  -- trust (text, in person). They can change it at /reset-password once
  -- signed in.
  update auth.users
     set encrypted_password = extensions.crypt('Temp-password-123', extensions.gen_salt('bf')),
         updated_at = now()
   where email = 'member@example.com';
  ```

**Turning email on later:**

1. Do path A or B below, plus "Both paths: finish setup", and test.
2. Vercel → Settings → Environment Variables: add
   `NEXT_PUBLIC_EMAIL_ENABLED` = `true`, then redeploy. Forgot password,
   "send a new link" and invites come back.
3. Supabase: turn **Confirm email** back on. New members confirm from then
   on. Members who joined during launch mode stay marked as confirmed even
   though their addresses were never checked.

**Why it matters:** Supabase's built-in sender only emails members of your
Supabase team, about 2 an hour. Until custom SMTP is set up, a real Aggie
who signs up never gets the confirmation link and can't get in.

The app code doesn't change for any of this. Everything happens in the
Supabase dashboard (and Resend or Google). **The SMTP password or API key
goes only into Supabase.** Never put it in the repo or in Vercel.

## Pick a path

| | **A. Resend + your own domain** (recommended) | **B. Gmail** (fastest) |
| --- | --- | --- |
| Ready in | 30–60 min, mostly waiting for DNS | 10 min |
| Cost | Domain ~$10–15/year; Resend Pro $20 for the launch month, then free | $0 |
| Daily limit | None on Pro (free: 100/day) | ~500/day |
| Inbox vs spam | Best (SPF, DKIM, DMARC on your domain) | Worse; comes from @gmail.com |
| Risk at 1,000 signups | Low | Google can temporarily lock a brand-new account that suddenly sends hundreds of emails |

**Good combination:** set up B tonight so signups work at all, start A in
parallel, and switch the SMTP settings to Resend once the domain verifies.
Switching is just editing the five SMTP fields. No code or deploy is needed.

## A. Resend + domain

1. **Get a domain.** Buy one (for example `aggieconnect.org`) from Cloudflare,
   Namecheap or Vercel Domains. The GitHub Student Developer Pack sometimes
   includes a free one-year domain; check with your school email.
2. **Resend:** sign up at resend.com → **Domains → Add domain**. Use a
   subdomain such as `mail.aggieconnect.org`, so email records stay separate
   from the website.
3. **DNS:** add every record Resend shows (an MX and a TXT for SPF, and a
   TXT for DKIM) at your domain registrar. Also add a DMARC record:
   - Type `TXT`, name `_dmarc`, value `v=DMARC1; p=none;`
4. Click **Verify** in Resend and wait for "Verified". It's often minutes,
   sometimes an hour or more.
5. **Upgrade to Pro** for the launch month (the free plan stops at 100 a
   day). Downgrade once signups slow down.
6. **API Keys → Create:** permission **Sending access**, limited to your
   domain. Copy it now; Resend shows it only once.
7. **Supabase → Authentication → Emails → SMTP Settings**, turn on custom SMTP:

   | Field | Value |
   | --- | --- |
   | Sender email | `no-reply@mail.aggieconnect.org` (your verified domain) |
   | Sender name | `Aggie Connect` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the API key |

## B. Gmail

1. **Create a new Gmail just for the site** (for example
   `aggieconnect.team@gmail.com`). Don't use your personal account: if
   Google locks it for sending too much, you don't want your own email
   locked.
2. Google Account → Security → turn on **2-Step Verification**. An app
   password requires it.
3. Go to **myaccount.google.com/apppasswords**, create one named
   "Supabase", and copy the 16-character password.
4. **Supabase → Authentication → Emails → SMTP Settings**, turn on custom SMTP:

   | Field | Value |
   | --- | --- |
   | Sender email | the new Gmail address |
   | Sender name | `Aggie Connect` |
   | Host | `smtp.gmail.com` |
   | Port | `465` |
   | Username | the new Gmail address |
   | Password | the 16-character app password |

5. With Gmail, invite people in waves (a few hundred a day) rather than all
   1,000 at once.

## Both paths: finish setup

1. **Rate limit:** Supabase → Authentication → **Rate Limits** → emails sent
   per hour. With custom SMTP it starts at 30/hour, which a launch blows
   through in minutes. Set **200** for Resend, or **100** for Gmail.
2. **Templates:** Supabase → Authentication → **Emails**. For each one,
   paste the file's contents (from `web/supabase/templates/`) into the body
   and set the subject:

   | Supabase tab | File | Subject |
   | --- | --- | --- |
   | Confirm signup | `confirm-signup.html` | Confirm your Aggie Connect account |
   | Reset password | `reset-password.html` | Reset your Aggie Connect password |
   | Invite user | `invite.html` | You're invited to Aggie Connect |

   All three use `token_hash` links to `/auth/confirm`, so they work even
   when someone opens the email on their phone and the site was on a laptop.
   The texts say links expire in **1 hour**, Supabase's default. If you change
   the email OTP expiration, update the texts too.
3. **URLs:** Authentication → URL Configuration. The Site URL must be the
   production address (`https://aggie-connect.vercel.app`, or your new
   domain if you point it at Vercel). Redirect URLs must include
   `<site>/auth/confirm`. The template links are built from the Site URL.

## Test before launch

With an email that is **not** on your Supabase team (try one Gmail and one
Outlook/school address):

- [ ] Sign up → the email arrives within a minute, **in the inbox** (check
      spam too) → the button signs you in.
- [ ] Forgot password → the email arrives → the button opens "choose a new
      password" → the new password works.
- [ ] `/admin` → invite someone → the email arrives → they can set a password.
- [ ] If anything fails: Supabase → **Logs → Auth** shows SMTP errors
      (wrong password, wrong port, unverified sender).

## Launch day

- Errors like "email rate limit exceeded" mean the Supabase rate limit is
  too low: raise it.
- Resend's dashboard shows every email and whether it was delivered or
  bounced. With Gmail, check the account's Sent folder.
- If Gmail locks the account, switch the SMTP settings to Resend (or Brevo
  as a stopgap).
- Anyone whose confirmation email got lost or expired can get a new one:
  **"Send a new link"** appears after signing up, and on the sign-in page
  when their email isn't confirmed yet. Supabase allows one per address per
  minute, and each one counts toward the hourly rate limit above.

## How many emails Supabase sends, and what raising it costs

- **Built-in sender:** about 2 emails an hour, and only to members of your
  Supabase team. Supabase doesn't sell more: **no plan, including Pro,
  raises it.** It's for development only.
- **With custom SMTP:** Supabase sends as many as the "emails per hour" rate
  limit allows. That limit is just a setting, and **raising it is free**.
  What you pay for is the email provider: Gmail $0 (~500/day), Resend free
  (100/day), or Resend Pro $20/month (50,000/month, no daily cap).
