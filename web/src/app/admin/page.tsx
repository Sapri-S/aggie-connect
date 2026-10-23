import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";
import { MemberList, type Member } from "./member-list";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Admin />
      </Suspense>
    </div>
  );
}

async function Admin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  // Non-admins get a 404, so the page doesn't advertise that it exists.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const { data, error } = await supabase.rpc("admin_list_members");
  if (error) throw new Error(`Couldn't load members (${error.code}: ${error.message})`);
  const members = (data ?? []) as Member[];

  const count = (s: Member["status"]) => members.filter((m) => m.status === s).length;
  const stats = [
    { label: "Members", value: members.length },
    { label: "Pending", value: count("pending") },
    { label: "Students", value: members.filter((m) => m.role === "student").length },
    { label: "Alumni", value: members.filter((m) => m.role === "alumni").length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Admin</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-bold">Invite someone</h2>
        <InviteForm enabled={createAdminClient() !== null} />
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-bold">Members</h2>
        <MemberList members={members} me={user.id} />
      </section>
    </div>
  );
}
