"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import EntrepriseSidebar from "@/components/layout/EntrepriseSidebar";
import EntrepriseHeader from "@/components/layout/EntrepriseHeader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import "@/styles/zalama-theme.css";

export default function EntrepriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // Vérification des conditions spéciales après chargement de la session
  useEffect(() => {
    if (!loading && session) {
      // Redirection obligatoire si require_password_change est true
      if (session.admin.require_password_change) {
        console.log(
          "Require password change detected, redirecting to first-login-change-password"
        );
        router.replace("/admin/first-login-change-password");
        return;
      }
    }
  }, [session, loading, router]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <EntrepriseSidebar />
        <div
          className="flex-1 flex flex-col transition-all duration-300"
          style={{
            marginLeft: "var(--current-sidebar-width, var(--sidebar-width))",
          }}
        >
          <EntrepriseHeader />
          <main
            className="flex-1 mb-8 overflow-y-auto text-gray-900 dark:text-white"
            style={{ scrollbarWidth: "none" }}
          >
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
