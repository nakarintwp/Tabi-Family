import type { Metadata, Viewport } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Tabi Family — Family Trip Planner",
  description: "Mobile-first family trip planner with Japan discovery, wishlist, templates, calendar, transport, readiness, offline mode and family collaboration.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tabi Family" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b8eea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
