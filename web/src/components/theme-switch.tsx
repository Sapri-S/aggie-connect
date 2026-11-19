"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, applyTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    // Storage blocked (private mode, site data off): follow the device.
    return "auto";
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed the setting.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) {
      applyTheme(e.newValue);
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function choose(theme: Theme) {
  try {
    if (theme === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Can't remember it; still apply it for this page view.
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

// Light / Dark / Auto segmented control.
export function ThemeSwitch({ className = "" }: { className?: string }) {
  // The server can't know the choice, so it renders "Auto" and the real
  // value takes over right after hydration.
  const theme = useSyncExternalStore(subscribe, read, () => "auto" as Theme);

  return (
    <fieldset className={className}>
      <legend className="sr-only">Display</legend>
      <div className="inline-flex rounded-md bg-surface-2 p-0.5">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={`inline-flex min-h-11 cursor-pointer items-center rounded px-3 text-sm font-semibold sm:min-h-8 has-focus-visible:outline-2 has-focus-visible:outline-primary ${
              theme === o.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={theme === o.value}
              onChange={() => choose(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
