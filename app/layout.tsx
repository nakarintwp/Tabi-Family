import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WinterAtmosphere } from "@/components/WinterAtmosphere";
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
  themeColor: "#244b68",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <WinterAtmosphere />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
