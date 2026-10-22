const SIZES = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-28 w-28 text-3xl",
} as const;

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
  const base = `${SIZES[size]} shrink-0 rounded-full ${className}`;

  if (url) {
    return (
      // Signed Supabase URLs expire, so skip next/image's optimizer cache.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "Profile photo"}
        className={`${base} object-cover`}
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
