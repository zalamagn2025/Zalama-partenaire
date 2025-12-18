import type { Metadata } from "next";
import "./globals.css";
import "../styles/toast.css";
import { QueryProvider } from "@/contexts/QueryProvider";
import { EdgeAuthProvider } from "@/contexts/EdgeAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SessionErrorHandler from "@/components/auth/SessionErrorHandler";
import { Toaster } from "@/components/ui/custom-toaster";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import NetworkStatus from "@/components/pwa/NetworkStatus";

export const metadata: Metadata = {
  title: "ZaLaMa Partner Dashboard",
  description: "Tableau de bord des partenaires ZaLaMa",
  applicationName: "Partner-ZaLaMa",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    title: "Partner-ZaLaMa",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#0d6efd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased font-sans">
        <QueryProvider>
          <ThemeProvider>
            <EdgeAuthProvider>
              <SessionErrorHandler>
                <NetworkStatus />
                <Toaster />
                <InstallPrompt />
                {children}
              </SessionErrorHandler>
            </EdgeAuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
