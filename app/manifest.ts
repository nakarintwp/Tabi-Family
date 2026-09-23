import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tabi Family",
    short_name: "Tabi Family",
    description: "Family trip planner with offline Today mode, collaboration and weather planning.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef5f8",
    theme_color: "#244b68",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
