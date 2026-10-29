// Optional public contact address, set in the hosting environment so no
// personal email is hard-coded in this (public) repo.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

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
