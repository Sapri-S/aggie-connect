import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/form-fields";

export const metadata: Metadata = { title: "Account deleted" };

export default function GoodbyePage() {
  return (
    <AuthCard title="Your account is deleted">
      <p className="text-muted">
        Your profile, photo and connections have been removed from Aggie
        Connect. Thanks for being part of it. Aggie Pride!
      </p>
      <Link
        href="/"
        className="mt-6 block rounded-md bg-primary px-4 py-2.5 text-center font-semibold text-on-primary hover:bg-primary-hover"
      >
        Back to Aggie Connect
      </Link>
    </AuthCard>
  );
}
