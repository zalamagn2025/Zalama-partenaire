"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import EntrepriseSidebar from "@/components/layout/EntrepriseSidebar";
import EntrepriseHeader from "@/components/layout/EntrepriseHeader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { FirstLoginChangePasswordModal } from "@/components/dashboard/FirstLoginChangePasswordModal";
import "@/styles/zalama-theme.css";

export default function EntrepriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Vérification des conditions spéciales après chargement de la session
  useEffect(() => {
    if (!loading && session) {
      // Afficher la modal obligatoire si require_password_change est true
      if (session.admin.require_password_change) {
        console.log(
          "Require password change detected, showing modal"
        );
        setShowPasswordModal(true);
        return;
      } else {
        setShowPasswordModal(false);
      }
    }
  }, [session, loading]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[var(--zalama-bg-darker)]">
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
      
      {/* Modal de changement de code PIN à la première connexion */}
      <FirstLoginChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />
    </ProtectedRoute>
  );
}
