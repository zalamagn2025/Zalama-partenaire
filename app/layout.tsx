import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EdgeAuthProvider } from "@/contexts/EdgeAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SessionErrorHandler from "@/components/auth/SessionErrorHandler";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZaLaMa Partner Dashboard",
  description: "Tableau de bord des partenaires ZaLaMa",
  applicationName: "Partner-ZaLaMa",
  manifest: "/manifest.json",
  themeColor: "#0d6efd",
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ThemeProvider>
          <EdgeAuthProvider>
            <SessionErrorHandler>
              <Toaster position="top-right" />
              {children}
            </SessionErrorHandler>
          </EdgeAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
