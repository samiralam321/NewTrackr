import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { SupabaseAuthSync } from "@/components/providers/clerk-supabase-sync-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Trackr - Share Progress & Stay Accountable",
  description: "A focused space for students to share daily learning progress, build consistency, and become 1% better every day.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} font-sans h-full antialiased`}
      >
        <body
          className={`${inter.variable} antialiased`}
        >
          <ThemeProvider>
            <SupabaseAuthSync>
              {children}
            </SupabaseAuthSync>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
