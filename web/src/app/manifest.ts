import type { MetadataRoute } from "next";

// "Add to Home Screen" metadata. Icons come from app/icon-*.png routes.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aggie Connect",
    short_name: "Aggie Connect",
    description: "Where NC A&T students and alumni find each other.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f4f6f9",
    theme_color: "#004684",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
