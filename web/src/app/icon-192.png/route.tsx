import { brandIcon } from "@/lib/brand-icon";

// Android home-screen icon, listed in app/manifest.ts.
export function GET() {
  return brandIcon(192);
}
