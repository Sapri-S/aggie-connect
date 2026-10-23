import type { Metadata } from "next";
import { AuthCard } from "@/components/form-fields";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Join" };

export default function SignupPage() {
  return (
    <AuthCard title="Join Aggie Connect">
      <SignupForm />
    </AuthCard>
  );
}
