import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WinterAtmosphere } from "@/components/WinterAtmosphere";

export const metadata: Metadata = {
  title: "Tabi Family — Japan Winter Trip Planner",
  description: "Mobile-first Japan family trip planner with a Japanese winter experience, built with Next.js, Supabase and Vercel.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17324d",
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
