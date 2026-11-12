import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPWA } from "@/components/pwa/InstallPWA";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
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
  manifest: "/manifest.webmanifest",
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
      className={`${inter.variable} ${playfair.variable} font-sans h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preload" as="image" href="/hero-bg.webp" type="image/webp" fetchPriority="high" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('trackr-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__deferredPrompt = e;
                if (window.__onBeforeInstallPrompt) {
                  window.__onBeforeInstallPrompt(e);
                }
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased min-h-full flex flex-col`}>
        <ThemeProvider>
          {children}
          <ServiceWorkerRegister />
          <InstallPWA />
        </ThemeProvider>
      </body>
    </html>
  );
}
