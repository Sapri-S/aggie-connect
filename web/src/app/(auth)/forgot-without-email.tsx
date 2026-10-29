import { CONTACT_EMAIL } from "@/lib/site";

// Shown instead of "Forgot password?" while the site can't send email: an
// admin resets the password by hand (docs/EMAIL-SETUP.md).
export function ForgotWithoutEmail() {
  return (
    <p className="text-sm text-muted">
      Forgot your password?{" "}
      {CONTACT_EMAIL ? (
        <a href={`mailto:${CONTACT_EMAIL}?subject=Password%20reset`} className="font-semibold text-primary hover:underline">
          Email us
        </a>
      ) : (
        "Ask a site admin"
      )}{" "}
      and we&apos;ll reset it.
    </p>
  );
}
