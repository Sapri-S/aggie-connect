import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

// Any email can sign up. Approval happens in the database when the email is
// confirmed (public.handle_email_confirmed), not here.
export const signupSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required.").max(50),
    lastName: z.string().trim().min(1, "Last name is required.").max(50),
    email: z.string().trim().toLowerCase().email("Enter a valid email."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(72, "Use 72 characters or fewer."),
    role: z.enum(["student", "alumni"], {
      message: "Choose student or alumni.",
    }),
    classYear: z.coerce
      .number()
      .int()
      .min(1891, "NC A&T was founded in 1891.")
      .max(CURRENT_YEAR + 6, "Enter your expected graduation year."),
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(72, "Use 72 characters or fewer."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "The passwords don't match.",
    path: ["confirm"],
  });

// Only https LinkedIn profile URLs. The database enforces the same rule.
export const linkedInUrl = z
  .string()
  .trim()
  .regex(
    /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/,
    "Use your LinkedIn profile URL, like https://www.linkedin.com/in/your-name",
  );

// Empty form fields become null, so clearing a field clears it in the database.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(50),
  lastName: z.string().trim().min(1, "Last name is required.").max(50),
  classYear: z.coerce
    .number()
    .int()
    .min(1891, "NC A&T was founded in 1891.")
    .max(CURRENT_YEAR + 6, "Enter your expected graduation year."),
  headline: optionalText(120),
  jobTitle: optionalText(100),
  company: optionalText(100),
  major: optionalText(80),
  city: optionalText(80),
  bio: optionalText(1000),
  linkedinUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.replace(/^http:\/\//, "https://")))
    .pipe(linkedInUrl.nullable()),
});

export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
  // Sign-in only: the account exists but its email isn't confirmed yet.
  unconfirmed?: boolean;
  // Echoed back so the form keeps what the user typed after an error.
  // Never includes passwords.
  values?: Record<string, string>;
};

export function echoValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && key !== "password" && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return values;
}

// Only allow redirects to paths on this site, never to another origin.
export function safeNext(next: unknown): string {
  return typeof next === "string" && /^\/(?!\/)[\w\-/]*$/.test(next)
    ? next
    : "/home";
}
