import { brandIcon } from "@/lib/brand-icon";

// Home-screen icon for iPhones and iPads. Full-bleed because iOS rounds the
// corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return brandIcon(180);
}
