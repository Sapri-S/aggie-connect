// Light / Dark / Auto display setting.
//
// The choice lives in localStorage (it's a per-device preference, nothing the
// server needs). THEME_SCRIPT runs in <head> before the page paints, so a
// forced theme never flashes the other one first. Reading a cookie on the
// server instead would make every page dynamic under Cache Components.

export type Theme = "light" | "dark" | "auto";

export const THEME_KEY = "theme";

// Browser bar color for each theme: the top bar's surface color.
export const THEME_COLORS = { light: "#ffffff", dark: "#18191c" } as const;

// Self-contained on purpose: it is also turned into a string for the inline
// script, so it can't use imports or anything outside its own body. Only the
// three known values are accepted; anything else counts as "auto".
export function applyTheme(choice: string | null) {
  const theme = choice === "light" || choice === "dark" ? choice : "auto";
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);

  const colors = { light: "#ffffff", dark: "#18191c" };
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const media = meta.getAttribute("media") ?? "";
    const auto = media.includes("dark") ? colors.dark : colors.light;
    meta.setAttribute("content", theme === "auto" ? auto : colors[theme]);
  });
}

// Runs once in <head>, and again when the document has loaded so the
// theme-color tags (which may come after this script) are updated too.
export const THEME_SCRIPT = `(function(){var a=${applyTheme.toString()};function r(){try{a(localStorage.getItem(${JSON.stringify(THEME_KEY)}))}catch(e){}}r();document.addEventListener("DOMContentLoaded",r)})();`;
