import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tabi Family",
    short_name: "Tabi Family",
    description: "Family trip planner with Japan discovery, wishlist, templates, calendar, transport, offline mode and collaboration.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4fbff",
    theme_color: "#1b8eea",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
