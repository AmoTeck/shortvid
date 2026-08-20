import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryCinema — AI Story Video Studio (100% Free)",
  description:
    "Create cinematic story videos from a single title. Voice-over, subtitles, consistent characters, platform growth engine — zero subscriptions.",
  keywords: [
    "story video",
    "AI filmmaking",
    "short film generator",
    "character consistency",
    "youtube shorts",
    "tiktok",
    "free video generator",
    "voice over",
    "subtitles",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StoryCinema",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07080d",
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
