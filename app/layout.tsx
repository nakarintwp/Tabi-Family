import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WinterAtmosphere } from "@/components/WinterAtmosphere";

export const metadata: Metadata = {
  title: "Tabi Family — Family Trip Planner",
  description: "Mobile-first family trip planner with a clean modern winter experience, built with Next.js, Supabase and Vercel.",
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
        {children}
      </body>
    </html>
  );
}
