# Launch checklist (owner tasks)

Written 2026-10-29, the night before launch. Expected: **1,000+ NC A&T
students and alumni**. These are dashboard and account steps that only the
owner can do. The code work is tracked in `LAUNCH-BUILD.md`.

Before you start, read [What it costs](#what-it-costs-for-1000-members).

## Tonight (blocks launch)

- [ ] **1. Email sender (custom SMTP).** Without it, nobody outside your
      Supabase team gets a confirmation email, so nobody can sign up.
      **Decided 2026-10-29: launch without email** (confirmation off, set up
      SMTP after launch). Do the "Launch mode: no email" steps in
      **`EMAIL-SETUP.md`**: turn off Confirm email, and let in anyone stuck.
- [x] **2. Test signup on production.** Done before 2026-10-29. **Do it
      again after step 1** with an email that isn't on your Supabase team:
      sign up, confirm, reset your password, and make sure the emails land in
      the inbox (not spam).
- [ ] **3. Signup protection.** Supabase → Authentication → Providers →
      Email: minimum password length **10**, require letters and digits.
      **CAPTCHA (important with email off):** the code is in; it turns on
      with keys. Order matters, or every sign-in fails:
      1. Cloudflare dashboard (free account) → **Turnstile → Add widget**.
         Hostnames: `aggie-connect.vercel.app` (and `localhost` for
         testing). Mode: Managed. Copy the **site key** and **secret key**.
      2. Vercel → Environment Variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` =
         the site key. **Redeploy**, and check the "I'm human" box shows on
         `/login` and `/signup`.
      3. Only then: Supabase → Authentication → **Attack Protection** →
         enable CAPTCHA, provider Turnstile, paste the **secret key**.
      4. Sign out and sign in again on production to confirm it works.
- [ ] **4. Stop bulk scraping.** Settings → API → **Max rows: 100**. Then
      open `/admin` and make sure every member still shows. If the list stops
      at 100, tell Claude so `admin_list_members()` gets paginated.
- [x] **5. Delete the demo members.** Done.
- [ ] **6. Protect `main`.** GitHub → Settings → Rules → new branch ruleset
      for `main`: require a pull request, require the **`web`** status check,
      block force pushes and deletion. Every push to `main` goes straight to
      production.
- [ ] **7. Dependabot alerts.** GitHub → Settings → Code security: turn on
      Dependabot alerts and security updates.
- [ ] **8. Run the new migration and merge the launch PR**, in that order.
      See "Deploy order" in `LAUNCH-BUILD.md`.
- [ ] **9. Contact email.** In Vercel → Settings → Environment Variables,
      add `NEXT_PUBLIC_CONTACT_EMAIL` (for example a new Gmail just for Aggie
      Connect). The privacy page and footer show it. Redeploy afterward.

## This week

- [ ] **Keep-alive and backups, or Supabase Pro.** Free projects pause after
      7 days with no activity, and the free plan has no downloadable backups.
      That's how the 1.x database was lost. Either upgrade to Pro, or ask
      Claude for a Vercel cron keep-alive plus a weekly `pg_dump` GitHub
      Action.
- [ ] Run Supabase → Database → **Advisors** (security and performance) after
      the new migration and fix anything it flags.
- [ ] Watch the browser console on production for CSP violations, then switch
      the CSP from report-only to enforced (see `HANDOFF-security.md` P1 #8).

## Launch day

- [ ] Keep `/admin` open: new members, and the new **Reports** queue.
- [ ] Keep Supabase → Logs open for auth errors (email failures show up here).
- [ ] If a deploy breaks something: Vercel → Deployments → previous one →
      **Instant Rollback**. If the break involves the database, tell Claude.
- [ ] Write down what people ask for. It decides what gets built next
      (messaging, jobs, events, mentor matching).

## What it costs for 1,000+ members

Checked 2026-10-29 against recent pricing write-ups: Resend Pro $20/month for
50,000 emails with no daily cap (free: 100/day), Supabase Pro $25/month
(free projects pause after a week idle). **Confirm on resend.com/pricing and
supabase.com/pricing before paying.**

### What the free tiers cover

| Service | Free limit | 1,000 members need | Fits? |
| --- | --- | --- | --- |
| Supabase (database, auth, photos) | 50,000 monthly users, 500 MB database, 1 GB files | ~5 MB of data, ~50 MB of photos | Yes, but **pauses after 7 idle days** and has no downloadable backups |
| Vercel Hobby (hosting) | Generous bandwidth, non-commercial only | Easily fits | Yes, while it stays a free, non-commercial student project |
| Email | Depends on provider (below) | **~1,000–1,500 emails in launch week** (confirmations + password resets), then a handful a week | **The bottleneck** |

### Email options for launch week

| Option | Cost | Daily limit | Can it be ready tonight? |
| --- | --- | --- | --- |
| **Gmail SMTP + app password** | $0 | ~500/day | **Yes.** No domain needed. Emails come from a gmail.com address and land in spam more often |
| Brevo free | $0 | 300/day | Yes, but often lands in spam without your own domain |
| Resend free | $0 | **100/day**, 3,000/month | Needs a domain and DNS records. Too small for launch day |
| **Resend Pro** | **$20/month** | 50,000/month, no daily cap | Needs a domain. DNS can verify in minutes or take hours |
| Amazon SES | ~$0.10 per 1,000 | High | Needs a domain **and** AWS approval to leave its sandbox (about a day). Not for tonight |
| Domain name (for Resend/SES) | ~$10–15/year | n/a | Possibly free for a year via the GitHub Student Developer Pack |

If all 1,000 people sign up on day one, Gmail (500/day) leaves about half of
them waiting until the next day for their confirmation email. Resend Pro for
the launch month avoids that.

### Three budgets

| Plan | Monthly | What you get | Risk |
| --- | --- | --- | --- |
| **Bare minimum** | **~$0** | Gmail SMTP, Supabase Free, Vercel Hobby, plus a keep-alive cron and backup Action (Claude can add both) | Confirmations capped near 500/day; some land in spam; restoring the database is manual |
| **Recommended for launch** | **~$46 the first month** ($25 Supabase Pro + $20 Resend Pro + ~$1 domain) | No pausing, daily backups, leaked-password protection, no email cap, emails from your own domain | None worth worrying about at this size |
| **Steady state after launch** | **~$26/month (~$310/year)** | Supabase Pro + domain; move Resend back to free (3,000/month is plenty after launch) | Low |

Vercel Pro ($20/month) is only needed if the site becomes commercial or is run
by an organization (Vercel's Hobby terms).
