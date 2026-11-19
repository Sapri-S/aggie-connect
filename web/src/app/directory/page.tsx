import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectButton } from "@/components/connect-button";
import { SearchIcon } from "@/components/icons";
import { signAvatarUrls } from "@/lib/avatars";
import { connectionStates } from "@/lib/connections";
import { OPEN_TO, type OpenTo } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Directory" };

const PAGE_SIZE = 24;

const ROLES = [
  { value: "", label: "Everyone" },
  { value: "student", label: "Students" },
  { value: "alumni", label: "Alumni" },
] as const;

const HELP = [{ value: "" as const, label: "Anyone" }, { value: "any" as const, label: "Open to helping" }, ...OPEN_TO];

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
    <div className="mx-auto max-w-screen-xl px-3 py-4 sm:px-4">
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
  const [{ data: people, count, error }, states] = await Promise.all([
    filtered(false)
      .order("last_name")
      .order("first_name")
      .order("id")
      .range(from, from + PAGE_SIZE - 1),
    connectionStates(supabase, user.id),
  ]);
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
  const filtering = Boolean(params.q || params.role || params.help);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[17.5rem_minmax(0,1fr)] xl:gap-6">
      {/* Filters: a left column on wide screens. */}
      <aside className="hidden xl:block">
        <div className="card sticky top-18 p-3">
          <h1 className="px-2 pt-1 text-2xl font-bold">Directory</h1>
          <FilterGroup title="Show">
            {ROLES.map((r) => (
              <FilterLink key={r.value} to={href({ ...params, role: r.value, page: 1 })} active={params.role === r.value}>
                {r.label}
              </FilterLink>
            ))}
          </FilterGroup>
          <FilterGroup title="Open to">
            {HELP.map((o) => (
              <FilterLink key={o.value} to={href({ ...params, help: o.value, page: 1 })} active={params.help === o.value}>
                {o.label}
              </FilterLink>
            ))}
          </FilterGroup>
        </div>
      </aside>

      <section aria-label="Results" className="mx-auto w-full max-w-170 space-y-4 xl:mx-0">
        <div className="card space-y-3 p-4">
          <h1 className="text-2xl font-bold xl:hidden">Directory</h1>
          <form action="/directory" role="search">
            {params.role && <input type="hidden" name="role" value={params.role} />}
            {params.help && <input type="hidden" name="help" value={params.help} />}
            <label className="flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-muted focus-within:outline-2 focus-within:outline-primary">
              <SearchIcon className="h-5 w-5 shrink-0" />
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Search by name, job, company, major or city"
                aria-label="Search Aggies"
                maxLength={80}
                className="min-h-11 w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
              />
            </label>
          </form>

          {/* Filters as chips on phones, tablets and laptops. */}
          <div className="space-y-2 xl:hidden">
            <nav aria-label="Filter by role" className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip key={r.value} to={href({ ...params, role: r.value, page: 1 })} active={params.role === r.value}>
                  {r.label}
                </Chip>
              ))}
            </nav>
            <nav aria-label="Filter by what they're open to" className="flex flex-wrap gap-2">
              {HELP.map((o) => (
                <Chip key={o.value} to={href({ ...params, help: o.value, page: 1 })} active={params.help === o.value}>
                  {o.label}
                </Chip>
              ))}
            </nav>
          </div>
        </div>

        <div className="card">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold text-muted" aria-live="polite">
            {total === 1 ? "1 Aggie" : `${total} Aggies`}
            {params.q && <> matching &ldquo;{params.q}&rdquo;</>}
          </p>

          {people && people.length > 0 ? (
            <ul className="divide-y divide-line">
              {people.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                  <Link href={`/u/${p.id}`} className="group flex min-w-0 flex-1 basis-60 items-center gap-3">
                    <Avatar
                      url={p.avatar_path ? urls.get(p.avatar_path) : null}
                      firstName={p.first_name}
                      lastName={p.last_name}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold group-hover:underline">
                        {p.first_name} {p.last_name}
                        {p.class_year && (
                          <span className="ml-1 font-normal text-muted">&apos;{String(p.class_year).slice(-2)}</span>
                        )}
                      </span>
                      <span className="block truncate text-sm text-muted">
                        {[work(p) || p.headline, p.city].filter(Boolean).join(" · ") ||
                          (p.role === "alumni" ? "Alumni" : "Student")}
                      </span>
                      {p.open_to?.length > 0 && (
                        <span className="mt-0.5 block text-xs font-semibold text-primary">Open to helping</span>
                      )}
                    </span>
                  </Link>
                  <div className="ml-auto">
                    <ConnectButton
                      otherId={p.id}
                      firstName={p.first_name}
                      state={states.get(p.id) ?? { kind: "none" }}
                      compact
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-10 text-center text-muted">
              {filtering
                ? "No Aggies match that. Try a shorter search or another filter."
                : "Nobody here yet. Invite your classmates."}
            </p>
          )}
        </div>

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
      </section>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h2 className="px-2 pb-1 text-sm font-semibold text-muted">{title}</h2>
      <nav aria-label={title} className="space-y-0.5">
        {children}
      </nav>
    </div>
  );
}

function FilterLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-10 items-center rounded-md px-2 font-semibold ${
        active ? "bg-primary-tint text-primary" : "hover:bg-surface-2"
      }`}
    >
      {children}
    </Link>
  );
}

function Chip({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold sm:min-h-8 ${
        active ? "bg-primary-tint text-primary" : "bg-surface-2 text-ink hover:bg-surface-3"
      }`}
    >
      {children}
    </Link>
  );
}

function PageLink({ to, rel, children }: { to: string | null; rel: string; children: ReactNode }) {
  if (!to) {
    return (
      <span aria-disabled className="btn btn-secondary cursor-default opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link href={to} rel={rel} className="btn btn-secondary">
      {children}
    </Link>
  );
}
