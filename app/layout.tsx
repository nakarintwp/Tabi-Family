import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WeatherAtmosphere } from "@/components/WeatherAtmosphere";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Tabi Family — Family Trip Planner",
  description: "Mobile-first family trip planner with offline mode, collaboration, exports and weather planning.",
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
        <WeatherAtmosphere />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
