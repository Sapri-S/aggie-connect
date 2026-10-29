// Optional public contact address, set in the hosting environment so no
// personal email is hard-coded in this (public) repo.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

// Set to "true" once Supabase has custom SMTP (docs/EMAIL-SETUP.md). Until
// then the site runs with email confirmation off in Supabase, and hides
// everything that sends email: forgot password, resend link, invites.
export const EMAIL_ENABLED = process.env.NEXT_PUBLIC_EMAIL_ENABLED === "true";

// Cloudflare Turnstile site key (public). When set, sign-in, sign-up and the
// email forms show a CAPTCHA; Supabase checks it with the secret key from
// Authentication → Attack Protection.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;

// What members can say they're open to helping with. Must match the CHECK on
// profiles.open_to (20261029000000_launch.sql).
export const OPEN_TO = [
  { value: "mentoring", label: "Mentoring" },
  { value: "referrals", label: "Job referrals" },
  { value: "resume_reviews", label: "Résumé reviews" },
  { value: "coffee_chats", label: "Coffee chats" },
] as const;

export type OpenTo = (typeof OPEN_TO)[number]["value"];

export const openToLabel = (value: string) =>
  OPEN_TO.find((o) => o.value === value)?.label ?? value;
