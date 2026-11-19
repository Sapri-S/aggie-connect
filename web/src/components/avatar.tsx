"use client";

import { useState } from "react";

const SIZES = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-28 w-28 text-3xl",
  xl: "h-32 w-32 text-4xl sm:h-40 sm:w-40",
} as const;

// Profile photo, or initials when there's no photo or it fails to load.
// Photo links are signed and expire after an hour, so a page left open
// (or restored from the browser cache) can hold dead links; those fall back
// to initials instead of showing a broken image.
export function Avatar({
  url,
  firstName,
  lastName,
  size = "md",
  className = "",
}: {
  url?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const base = `${SIZES[size]} shrink-0 rounded-full ${className}`;

  if (url && failedUrl !== url) {
    return (
      // Signed Supabase URLs expire, so skip next/image's optimizer cache.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "Profile photo"}
        className={`${base} bg-primary-tint object-cover`}
        onError={() => setFailedUrl(url)}
        // An image that failed before React hydrated never fires onError,
        // so check once when it mounts.
        ref={(img) => {
          if (img?.complete && img.naturalWidth === 0) setFailedUrl(url);
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`${base} flex items-center justify-center bg-primary-tint font-heading font-bold text-primary`}
    >
      {firstName?.[0]}
      {lastName?.[0]}
    </div>
  );
}
