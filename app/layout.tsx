import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import { SessionDebugger } from "@/components/auth/SessionDebugger";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
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
      <body className={`${dmSans.variable} antialiased font-sans`}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            {children}
            <SessionDebugger />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
