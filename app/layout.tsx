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
  icons: {
    icon: "/images/logo-fav.png",
    shortcut: "/images/logo-fav.png",
    apple: "/images/logo-fav.png",
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
