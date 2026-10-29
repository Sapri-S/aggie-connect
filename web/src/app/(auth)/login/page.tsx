import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/form-fields";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  confirm_failed: "That confirmation link is invalid or expired. Sign in below and we'll offer to send a new one.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard title="Welcome back, Aggie">
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithParams({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={typeof next === "string" ? next : undefined}
      notice={typeof error === "string" ? NOTICES[error] : undefined}
    />
  );
}
