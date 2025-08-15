"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { toast } from "sonner";

interface SessionErrorHandlerProps {
  children: React.ReactNode;
}

export default function SessionErrorHandler({
  children,
}: SessionErrorHandlerProps) {
  const { session, error, clearError, logout } = useEdgeAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Écouter les erreurs de session
    const handleSessionError = (event: CustomEvent) => {
      const errorMessage = event.detail?.message || "";

      if (
        errorMessage.includes("Session expirée") ||
        errorMessage.includes("401") ||
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized")
      ) {
        console.log("Session expirée détectée, redirection vers login");
        toast.error("Session expirée. Veuillez vous reconnecter.");
        logout();
        router.push("/login");
      }
    };

    // Écouter les erreurs globales
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("Session expirée") ||
        event.error?.message?.includes("401")
      ) {
        console.log("Erreur globale de session détectée");
        toast.error("Session expirée. Veuillez vous reconnecter.");
        logout();
        router.push("/login");
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener("session-error" as any, handleSessionError);
    window.addEventListener("error", handleGlobalError);

    return () => {
      window.removeEventListener("session-error" as any, handleSessionError);
      window.removeEventListener("error", handleGlobalError);
    };
  }, [logout, router]);

  // Gérer les erreurs du contexte
  useEffect(() => {
    if (error) {
      if (
        error.includes("Session expirée") ||
        error.includes("401") ||
        error.includes("token") ||
        error.includes("unauthorized")
      ) {
        console.log("Erreur de session dans le contexte");
        toast.error("Session expirée. Veuillez vous reconnecter.");
        logout();
        router.push("/login");
      }
      clearError();
    }
  }, [error, logout, router, clearError]);

  return <>{children}</>;
}
