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

  // Fonction pour détecter les erreurs de token expiré
  const isTokenExpiredError = (errorMessage: string): boolean => {
    const tokenExpiredPatterns = [
      "token",
      "unauthorized",
      "Session expirée",
      "401",
      "403",
      "404",
      "500",
      "503",
      "refresh token expired",
      "access token expired",
      "invalid token",
      "expired",
      "authentication failed",
      "not found",
      "service unavailable",
      "internal server error",
      "erreur serveur",
      "server error",
    ];

    return tokenExpiredPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Fonction de déconnexion avec redirection
  const handleTokenExpired = async () => {
    try {
      console.log("🔑 Erreur d'authentification détectée, déconnexion automatique");
      toast.error("Session expirée. Redirection vers la connexion...");
      
      // Nettoyer immédiatement la session
      await logout();
      
      // Redirection immédiate sans délai
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion automatique:", error);
      // Forcer la redirection même en cas d'erreur
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    // Écouter les erreurs de session
    const handleSessionError = (event: CustomEvent) => {
      const errorMessage = event.detail?.message || "";

      if (isTokenExpiredError(errorMessage)) {
        handleTokenExpired();
      }
    };

    // Écouter les erreurs globales
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || "";

      if (isTokenExpiredError(errorMessage)) {
        handleTokenExpired();
      }
    };

    // Écouter les erreurs de fetch (requêtes API)
    const handleFetchError = (event: Event) => {
      const target = event.target as any;
      if (target && target.status) {
        if (target.status === 401 || target.status === 403 || target.status === 404 || target.status === 500 || target.status === 503) {
          console.log(
            "🔑 Erreur serveur détectée dans une requête fetch"
          );
          handleTokenExpired();
        }
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener("session-error" as any, handleSessionError);
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", (event) => {
      const errorMessage =
        event.reason?.message || event.reason?.toString() || "";
      if (isTokenExpiredError(errorMessage)) {
        handleTokenExpired();
      }
    });

    return () => {
      window.removeEventListener("session-error" as any, handleSessionError);
      window.removeEventListener("error", handleGlobalError);
    };
  }, [logout, router]);

  // Gérer les erreurs du contexte
  useEffect(() => {
    if (error && isTokenExpiredError(error)) {
      handleTokenExpired();
    }
  }, [error]);

  return <>{children}</>;
}
