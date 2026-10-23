// Fails when a migration creates a table without enabling Row Level
// Security on it in the same file. The publishable key is public, so RLS is
// the access control: a table without it is readable by anyone.
//
// Usage: node scripts/check-rls.mjs [migrations dir]

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "supabase/migrations";

// Strips comments so a commented-out statement doesn't count either way.
function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
}

// public.profiles, "public"."profiles" and profiles all name the same table.
function normalize(name) {
  const parts = name.replaceAll('"', "").toLowerCase().split(".");
  return parts.length === 1 ? `public.${parts[0]}` : parts.join(".");
}

const ident = String.raw`((?:"[^"]+"|\w+)(?:\s*\.\s*(?:"[^"]+"|\w+))?)`;
const createRe = new RegExp(
  String.raw`create\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?${ident}`,
  "gi",
);
const enableRe = new RegExp(
  String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${ident}\s+enable\s+row\s+level\s+security`,
  "gi",
);

const failures = [];
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const sql = stripComments(readFileSync(join(dir, file), "utf8"));
  const enabled = new Set(
    [...sql.matchAll(enableRe)].map((m) => normalize(m[1].replace(/\s/g, ""))),
  );
  for (const m of sql.matchAll(createRe)) {
    const table = normalize(m[1].replace(/\s/g, ""));
    if (!enabled.has(table)) failures.push(`${file}: ${table}`);
  }
}

if (failures.length) {
  console.error("Tables created without `enable row level security` in the same migration:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`RLS check passed (${files.length} migrations).`);
