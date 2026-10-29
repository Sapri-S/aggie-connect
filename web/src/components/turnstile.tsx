"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/site";

type TurnstileApi = {
  render(el: HTMLElement, options: { sitekey: string; size?: "normal" | "flexible" | "compact" }): string;
  reset(id: string): void;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Cloudflare Turnstile ("I'm human" check). Renders nothing until
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Place it inside a <form>: the
// widget adds a hidden cf-turnstile-response field that the Server Action
// passes to Supabase. Tokens work once, so pass the form's action state as
// resetKey to get a fresh token after every submit.
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ready || !container.current || !window.turnstile) return;
    const id = window.turnstile.render(container.current, { sitekey: TURNSTILE_SITE_KEY, size: "flexible" });
    widget.current = id;
    return () => {
      window.turnstile?.remove(id);
      widget.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <>
      {/* onReady also fires on later mounts, after client-side navigation. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={container} className="min-h-[65px]" />
    </>
  );
}
