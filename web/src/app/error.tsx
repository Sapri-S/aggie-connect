"use client";

import Link from "next/link";

// Shown when a page throws. In production Next.js replaces the message with
// a generic digest, so database details never reach visitors.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t load this page. Try again in a moment.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-primary-tint p-3 text-left text-xs text-danger">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => retry()}
          className="rounded-md bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link href="/home" className="rounded-md border border-line px-4 py-2 font-semibold hover:bg-primary-tint">
          Go home
        </Link>
      </div>
    </div>
  );
}
