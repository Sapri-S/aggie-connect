import type { ReactNode } from "react";

// Long-form text pages (privacy, guidelines).
export function DocPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated {updated}</p>
      <div className="mt-6 space-y-4 leading-relaxed [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
