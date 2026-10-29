import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { signAvatarUrls } from "@/lib/avatars";
import { OPEN_TO, type OpenTo } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Directory" };

const PAGE_SIZE = 24;

const ROLES = [
  { value: "", label: "Everyone" },
  { value: "student", label: "Students" },
  { value: "alumni", label: "Alumni" },
] as const;

// Columns a search term can match.
const SEARCH_COLUMNS = ["first_name", "last_name", "headline", "job_title", "company", "major", "city"];

type Params = { q: string; role: string; help: OpenTo | "any" | ""; page: number };

function readParams(raw: Record<string, string | string[] | undefined>): Params {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const page = Number.parseInt(one(raw.page), 10);
  const role = one(raw.role);
  const help = one(raw.help);
  return {
    q: one(raw.q).trim().slice(0, 80),
    role: role === "student" || role === "alumni" ? role : "",
    help: help === "any" || OPEN_TO.some((o) => o.value === help) ? (help as Params["help"]) : "",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

// Keeps only letters, digits, spaces and a few name characters, so a search
// can't add operators to the PostgREST filter it's placed in.
function searchWords(q: string) {
  return q
    .replace(/[^\p{L}\p{N}\s'.-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
}

function href({ q, role, help, page }: Params) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (role) sp.set("role", role);
  if (help) sp.set("help", help);
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return s ? `/directory?${s}` : "/directory";
}

export default function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Directory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Directory({ searchParams }: Pick<PageProps<"/directory">, "searchParams">) {
  const params = readParams(await searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(href(params))}`);

  // RLS returns only approved members, and only to approved members.
  const filtered = (head: boolean) => {
    let query = supabase
      .from("profiles")
      .select("id, first_name, last_name, role, class_year, headline, job_title, company, city, avatar_path, open_to", {
        count: "exact",
        head,
      })
      .neq("id", user.id);
    if (params.role) query = query.eq("role", params.role);
    if (params.help === "any") query = query.neq("open_to", "{}");
    else if (params.help) query = query.contains("open_to", [params.help]);
    // Every word has to match at least one column.
    for (const word of searchWords(params.q)) {
      query = query.or(SEARCH_COLUMNS.map((c) => `${c}.ilike.*${word}*`).join(","));
    }
    return query;
  };

  const from = (params.page - 1) * PAGE_SIZE;
  const { data: people, count, error } = await filtered(false)
    .order("last_name")
    .order("first_name")
    .order("id")
    .range(from, from + PAGE_SIZE - 1);
  // A page past the end (an old link, a hand-edited URL) is a PostgREST
  // error, not an empty list. Send it to the last page that exists.
  if (error?.code === "PGRST103") {
    const { count: all } = await filtered(true);
    redirect(href({ ...params, page: Math.max(1, Math.ceil((all ?? 0) / PAGE_SIZE)) }));
  }
  if (error) throw new Error(`Couldn't load the directory (${error.code}: ${error.message})`);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const urls = await signAvatarUrls(supabase, (people ?? []).map((p) => p.avatar_path));
  const work = (p: { job_title: string | null; company: string | null }) =>
    [p.job_title, p.company].filter(Boolean).join(" at ");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Directory</h1>
        <p className="mt-1 text-sm text-muted">Find Aggies by name, job, company, major or city.</p>
      </div>

      <form action="/directory" className="flex gap-2" role="search">
        {params.role && <input type="hidden" name="role" value={params.role} />}
        {params.help && <input type="hidden" name="help" value={params.help} />}
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search Aggies"
          aria-label="Search Aggies"
          maxLength={80}
          className="min-h-11 w-full min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button className="min-h-11 shrink-0 rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover">
          Search
        </button>
      </form>

      <nav aria-label="Filter by what they're open to" className="flex flex-wrap gap-2">
        {[{ value: "" as const, label: "Anyone" }, { value: "any" as const, label: "Open to helping" }, ...OPEN_TO].map((o) => (
          <Link
            key={o.value}
            href={href({ ...params, help: o.value, page: 1 })}
            aria-current={params.help === o.value ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm font-semibold sm:min-h-0 sm:py-1 ${
              params.help === o.value
                ? "border-transparent bg-gold text-on-gold"
                : "border-line text-muted hover:border-gold hover:text-ink"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Filter by role" className="flex gap-1">
          {ROLES.map((r) => (
            <Link
              key={r.value}
              href={href({ ...params, role: r.value, page: 1 })}
              aria-current={params.role === r.value ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold sm:min-h-0 sm:py-1.5 ${
                params.role === r.value
                  ? "bg-primary text-on-primary"
                  : "text-muted hover:bg-primary-tint hover:text-ink"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted" aria-live="polite">
          {total === 1 ? "1 Aggie" : `${total} Aggies`}
          {params.q && <> matching &ldquo;{params.q}&rdquo;</>}
        </p>
      </div>

      {people && people.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/u/${p.id}`}
                className="flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-primary"
              >
                <Avatar
                  url={p.avatar_path ? urls.get(p.avatar_path) : null}
                  firstName={p.first_name}
                  lastName={p.last_name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {p.first_name} {p.last_name}{" "}
                    {p.class_year && (
                      <span className="text-primary">&apos;{String(p.class_year).slice(-2)}</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {[work(p) || p.headline, p.city].filter(Boolean).join(" · ") ||
                      (p.role === "alumni" ? "Alumni" : "Student")}
                  </p>
                  {p.open_to?.length > 0 && (
                    <p className="mt-1">
                      <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-on-gold">
                        Open to helping
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-muted">
          {params.q || params.role || params.help
            ? "No Aggies match that. Try a shorter search or another filter."
            : "Nobody here yet. Bring your Aggie Pride and invite your classmates!"}
        </p>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-2">
          <PageLink to={params.page > 1 ? href({ ...params, page: params.page - 1 }) : null} rel="prev">
            ← Previous
          </PageLink>
          <p className="text-sm text-muted">
            Page {Math.min(params.page, pages)} of {pages}
          </p>
          <PageLink to={params.page < pages ? href({ ...params, page: params.page + 1 }) : null} rel="next">
            Next →
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({ to, rel, children }: { to: string | null; rel: string; children: React.ReactNode }) {
  const cls = "inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm font-semibold";
  if (!to) {
    return (
      <span aria-disabled className={`${cls} text-muted opacity-50`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={to} rel={rel} className={`${cls} bg-surface hover:bg-primary-tint`}>
      {children}
    </Link>
  );
}
