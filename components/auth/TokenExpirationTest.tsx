"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";

export default function TokenExpirationTest() {
  const { session, refreshSession, logout } = useEdgeAuthContext();
  const [isTesting, setIsTesting] = useState(false);

  // Simuler une erreur de token expiré
  const simulateTokenExpired = () => {
    setIsTesting(true);

    // Créer une erreur personnalisée pour simuler l'expiration du token
    const tokenExpiredError = new Error(
      "Session expirée. Veuillez vous reconnecter."
    );
    (tokenExpiredError as any).status = 401;

    // Déclencher l'événement d'erreur de session
    const event = new CustomEvent("session-error", {
      detail: {
        message: "Session expirée. Veuillez vous reconnecter.",
        status: 401,
        error: tokenExpiredError,
      },
    });

    window.dispatchEvent(event);

    setTimeout(() => {
      setIsTesting(false);
    }, 2000);
  };

  // Simuler une erreur de refresh token expiré
  const simulateRefreshTokenExpired = () => {
    setIsTesting(true);

    // Créer une erreur personnalisée pour simuler l'expiration du refresh token
    const refreshTokenExpiredError = new Error("Refresh token expired");
    (refreshTokenExpiredError as any).status = 403;

    // Déclencher l'événement d'erreur de session
    const event = new CustomEvent("session-error", {
      detail: {
        message: "Refresh token expired",
        status: 403,
        error: refreshTokenExpiredError,
      },
    });

    window.dispatchEvent(event);

    setTimeout(() => {
      setIsTesting(false);
    }, 2000);
  };

  // Tester le refresh manuel
  const testManualRefresh = async () => {
    setIsTesting(true);
    try {
      await refreshSession();
      console.log("✅ Refresh manuel réussi");
    } catch (error) {
      console.error("❌ Erreur lors du refresh manuel:", error);
    } finally {
      setIsTesting(false);
    }
  };

  // Déconnexion manuelle
  const handleManualLogout = async () => {
    setIsTesting(true);
    try {
      await logout();
      console.log("✅ Déconnexion manuelle réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
    } finally {
      setIsTesting(false);
    }
  };

  if (!session) {
    return null; // Ne pas afficher si pas de session
  }

  return (
    <Card className="mt-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <AlertTriangle className="w-5 h-5" />
          Test de Gestion des Tokens Expirés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-600 dark:text-orange-400">
          <p>
            Ce composant permet de tester la gestion des erreurs de tokens
            expirés.
          </p>
          <p className="mt-2">
            <strong>Session actuelle:</strong> {session.partner?.company_name}
            (Token: {session.access_token?.substring(0, 20)}...)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={simulateTokenExpired}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/30"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Simuler Token Expiré
          </Button>

          <Button
            onClick={simulateRefreshTokenExpired}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Simuler Refresh Token Expiré
          </Button>

          <Button
            onClick={testManualRefresh}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Test Refresh Manuel
          </Button>

          <Button
            onClick={handleManualLogout}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion Manuelle
          </Button>
        </div>

        {isTesting && (
          <div className="text-center text-sm text-orange-600 dark:text-orange-400">
            Test en cours...
          </div>
        )}

        <div className="text-xs text-orange-500 dark:text-orange-400">
          <p>
            <strong>Note:</strong> Ces tests simulent des erreurs
            d'authentification.
          </p>
          <p>
            En cas d'erreur de token expiré, vous serez automatiquement redirigé
            vers /login.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
