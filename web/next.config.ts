import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Avatars are signed Storage URLs. The browser never calls Supabase
// otherwise: auth and data go through Server Actions on this origin.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

// Nonces don't work with Partial Prerendering (see Next's CSP guide), so
// inline scripts are allowed. Everything else is locked to this origin.
// Report-Only for now: violations show in the browser console without
// breaking anything. Switch the header name to enforce.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${supabaseOrigin}`.trim(),
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // HSTS already forces HTTPS. Add upgrade-insecure-requests when enforcing;
  // browsers ignore it in a report-only policy.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Profile photos are capped at 4 MB; this leaves room for form overhead
      // and stays under Vercel's 4.5 MB request limit.
      bodySizeLimit: "4.5mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
