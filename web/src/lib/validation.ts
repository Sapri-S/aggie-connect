import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(50),
    lastName: z.string().trim().min(1, "Last name is required.").max(50),
    email: z.string().trim().toLowerCase().email("Enter a valid email."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(72, "Use 72 characters or fewer."),
    role: z.enum(["student", "former_student"], {
      message: "Choose student or former student.",
    }),
    classYear: z.coerce
      .number()
      .int()
      .min(1876, "Texas A&M opened in 1876.")
      .max(CURRENT_YEAR + 6, "Enter your expected graduation year."),
  })
  .refine((v) => v.role !== "student" || v.email.endsWith("@tamu.edu"), {
    message: "Current students sign up with their @tamu.edu email.",
    path: ["email"],
  });

// Only https LinkedIn profile URLs. The database enforces the same rule.
export const linkedInUrl = z
  .string()
  .trim()
  .regex(
    /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/,
    "Use your LinkedIn profile URL, like https://www.linkedin.com/in/your-name",
  );

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
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
