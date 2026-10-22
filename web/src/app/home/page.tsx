import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

const shortYear = (year: number | null) =>
  year ? `'${String(year).slice(-2)}` : "";

export default function HomePage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-6xl px-4 py-8 text-muted">Loading…</p>}
    >
      <Home />
    </Suspense>
  );
}

async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/home");

  const { data: me } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, status, class_year, major, city")
    .eq("id", user.id)
    .single();

  // RLS returns only approved members, and only to approved members,
  // so a pending user gets an empty list here.
  const { data: aggies } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, class_year, headline, city")
    .neq("id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit overflow-hidden rounded-xl border border-line bg-surface">
        <div className="h-16 border-b-4 border-gold bg-brand" />
        <div className="px-5 pb-5">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-surface bg-primary-tint font-heading text-xl font-bold text-primary">
            {me?.first_name?.[0]}
            {me?.last_name?.[0]}
          </div>
          <p className="mt-2 font-heading text-lg font-bold">
            {me?.first_name} {me?.last_name}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {me?.class_year && (
              <span className="rounded-full bg-gold px-2 py-0.5 font-semibold text-on-gold">
                Class of {shortYear(me.class_year)}
              </span>
            )}
            <span className="rounded-full border border-line px-2 py-0.5 text-muted">
              {me?.role === "alumni" ? "Alumni" : me?.role === "admin" ? "Admin" : "Student"}
            </span>
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold">Aggie Pride, {me?.first_name ?? "Aggie"}!</h1>
          {me?.status === "pending" && (
            <p className="mt-3 rounded-md border border-line bg-primary-tint px-4 py-3 text-sm">
              Your account is waiting for approval. Alumni are reviewed
              by an admin before they can see the directory. We&apos;ll let you in
              as soon as you&apos;re verified.
            </p>
          )}
          {me?.status === "suspended" && (
            <p className="mt-3 rounded-md border border-line bg-primary-tint px-4 py-3 text-sm text-danger">
              Your account is suspended. Contact an admin.
            </p>
          )}
        </div>

        {me?.status === "approved" && (
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-bold">Newest Aggies</h2>
            {aggies && aggies.length > 0 ? (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {aggies.map((a) => (
                  <li key={a.id} className="rounded-lg border border-line p-3">
                    <p className="font-semibold">
                      {a.first_name} {a.last_name}{" "}
                      <span className="text-primary">{shortYear(a.class_year)}</span>
                    </p>
                    <p className="text-sm text-muted">
                      {[a.headline, a.city].filter(Boolean).join(" · ") || "New to Aggie Connect"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                You&apos;re one of the first. Invite your fellow Aggies!
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
