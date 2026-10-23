import { brandIcon } from "@/lib/brand-icon";

// Maskable Android icon, listed in app/manifest.ts. The mark stays inside the
// safe zone, since launchers crop it to a circle or squircle.
export function GET() {
  return brandIcon(512, 0.15);
}
