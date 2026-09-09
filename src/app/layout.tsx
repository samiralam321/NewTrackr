import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPWA } from "@/components/pwa/InstallPWA";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7C3AED" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0A10" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Trackr - Share Progress & Stay Accountable",
    template: "%s | Trackr",
  },
  description:
    "A focused space for students to share daily learning progress, build consistency, and become 1% better every day.",
  applicationName: "Trackr",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trackr",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192x192.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${inter.variable} antialiased min-h-full flex flex-col`}>
        <ThemeProvider>
          {children}
          <ServiceWorkerRegister />
          <InstallPWA />
        </ThemeProvider>
      </body>
    </html>
  );
}
