"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  edgeFunctionService,
  AuthSession,
  LoginRequest,
} from "@/lib/edgeFunctionService";

interface UseEdgeAuthReturn {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  login: (
    credentials: LoginRequest
  ) => Promise<{ error: any; session?: AuthSession | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  isSessionValid: () => boolean;
}

// Configuration du refresh automatique
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // 8 minutes (avant l'expiration de 10 minutes)
const TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // 2 minutes de marge

export function useEdgeAuth(): UseEdgeAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Références pour le refresh automatique
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Fonction de déconnexion avec redirection
  const logoutWithRedirect = useCallback(async () => {
    // Éviter les déconnexions multiples
    if (isLoggingOutRef.current) {
      console.log("🚪 Déconnexion déjà en cours, ignorée");
      return;
    }

    try {
      isLoggingOutRef.current = true;
      console.log("🚪 Déconnexion automatique en cours...");

      // Arrêter le refresh automatique
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // Nettoyer la session
      setSession(null);
      localStorage.removeItem("partner_session");
      setError(null);

      console.log("✅ Déconnexion terminée, redirection vers /login");

      // Rediriger vers la page de connexion seulement si on n'y est pas déjà
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
      // Forcer la redirection même en cas d'erreur, seulement si nécessaire
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [router]);

  // Récupérer la session depuis le localStorage au démarrage
  useEffect(() => {
    const initializeSession = () => {
      try {
        const storedSession = localStorage.getItem("partner_session");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          // Vérifier si la session n'est pas expirée (tokens valides)
          if (parsedSession.access_token) {
            setSession(parsedSession);
            // Démarrer le refresh automatique si on a une session valide
            // On le fera dans un useEffect séparé après la définition de startAutoRefresh
          } else {
            localStorage.removeItem("partner_session");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
        localStorage.removeItem("partner_session");
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Sauvegarder la session dans le localStorage
  const saveSession = useCallback((sessionData: AuthSession) => {
    try {
      localStorage.setItem("partner_session", JSON.stringify(sessionData));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la session:", error);
    }
  }, []);

  // Supprimer la session du localStorage
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem("partner_session");
    } catch (error) {
      console.error("Erreur lors de la suppression de la session:", error);
    }
  }, []);

  // Fonction de connexion
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response = await edgeFunctionService.login(credentials);

        if (
          response.success &&
          response.user &&
          response.partner_info &&
          response.access_token
        ) {
          const sessionData: AuthSession = {
            user: {
              id: response.user.id,
              email: response.user.email,
            },
            admin: response.user,
            partner: response.partner_info,
            access_token: response.access_token,
            refresh_token: response.refresh_token || "",
          };

          setSession(sessionData);
          saveSession(sessionData);

          // Le refresh automatique sera démarré par le useEffect
          lastRefreshRef.current = Date.now();

          return { error: null, session: sessionData };
        } else {
          // Analyser le message d'erreur pour le rendre plus précis
          let errorMessage = response.message || "Erreur de connexion";

          // Personnaliser les messages d'erreur selon le type
          if (
            errorMessage.toLowerCase().includes("invalid credentials") ||
            errorMessage.toLowerCase().includes("email") ||
            errorMessage.toLowerCase().includes("password")
          ) {
            errorMessage =
              "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
          } else if (errorMessage.toLowerCase().includes("user not found")) {
            errorMessage = "Aucun compte trouvé avec cette adresse email.";
          } else if (
            errorMessage.toLowerCase().includes("inactive") ||
            errorMessage.toLowerCase().includes("disabled")
          ) {
            errorMessage =
              "Ce compte a été désactivé. Contactez l'administrateur.";
          }

          setError(errorMessage);
          return { error: { message: errorMessage } };
        }
      } catch (error: any) {
        const errorMessage = error.message || "Erreur de connexion";
        setError(errorMessage);
        return { error: { message: errorMessage } };
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setSession(null);
      clearSession();
      setError(null);

      // Arrêter le refresh automatique
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  // Fonction pour détecter les erreurs de token expiré
  const isTokenExpiredError = useCallback((error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString() || "";
    const errorStatus = error.status || error.code;

    // Erreurs liées aux tokens expirés et erreurs serveur
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

    // Vérifier les patterns dans le message d'erreur
    const hasTokenError = tokenExpiredPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );

    // Vérifier les codes d'erreur HTTP
    const hasTokenStatus = errorStatus === 401 || errorStatus === 403 || errorStatus === 404 || errorStatus === 500 || errorStatus === 503;

    return hasTokenError || hasTokenStatus;
  }, []);

  // Fonction de refresh automatique (définie après logout)
  const startAutoRefresh = useCallback(() => {
    // Nettoyer l'interval précédent
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Démarrer le refresh automatique
    refreshIntervalRef.current = setInterval(async () => {
      if (isRefreshingRef.current) {
        console.log("🔄 Refresh automatique ignoré - refresh en cours");
        return;
      }

      try {
        isRefreshingRef.current = true;
        console.log("🔄 Refresh automatique du token en cours...");

        // Appeler le refresh de session directement
        if (session?.access_token) {
          const response = await edgeFunctionService.getMe(
            session.access_token
          );

          if (
            response.success &&
            response.data?.user &&
            response.data?.partner_info
          ) {
            const sessionData: AuthSession = {
              user: {
                id: response.data.user.id,
                email: response.data.user.email,
              },
              admin: response.data.user,
              partner: response.data.partner_info,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            };

            setSession(sessionData);
            saveSession(sessionData);
            lastRefreshRef.current = Date.now();
            console.log("✅ Refresh automatique du token terminé avec succès");
          } else {
            console.log("❌ Session invalide lors du refresh automatique");
            await logoutWithRedirect();
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors du refresh automatique:", error);

        // Vérifier si c'est une erreur de token expiré
        if (isTokenExpiredError(error)) {
          console.log("🔑 Token expiré détecté, déconnexion automatique");
          await logoutWithRedirect();
        }
      } finally {
        isRefreshingRef.current = false;
      }
    }, TOKEN_REFRESH_INTERVAL);

    console.log(
      `🔄 Refresh automatique configuré toutes les ${
        TOKEN_REFRESH_INTERVAL / 60000
      } minutes`
    );
  }, [session, saveSession, logoutWithRedirect, isTokenExpiredError]);

  // Démarrer le refresh automatique quand la session est disponible (après la définition de startAutoRefresh)
  useEffect(() => {
    if (session?.access_token) {
      startAutoRefresh();
    }
  }, [session?.access_token, startAutoRefresh]);

  // Fonction de rafraîchissement de session
  const refreshSession = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await edgeFunctionService.getMe(session.access_token);

      if (
        response.success &&
        response.data?.user &&
        response.data?.partner_info
      ) {
        const sessionData: AuthSession = {
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
          },
          admin: response.data.user,
          partner: response.data.partner_info,
          access_token: session.access_token, // Garder le même token
          refresh_token: session.refresh_token,
        };

        setSession(sessionData);
        saveSession(sessionData);
        console.log("✅ Session rafraîchie avec succès");
      } else {
        // Si la session n'est plus valide, déconnecter
        console.log("❌ Session invalide, déconnexion automatique");
        await logoutWithRedirect();
      }
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement de session:", error);

      // Vérifier si c'est une erreur de token expiré
      if (isTokenExpiredError(error)) {
        console.log("🔑 Token expiré détecté, déconnexion automatique");
        await logoutWithRedirect();
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [session, saveSession, logoutWithRedirect, isTokenExpiredError]);

  // Fonction pour vérifier si la session est valide
  const isSessionValid = useCallback(() => {
    return !!(session?.access_token && session?.admin && session?.partner);
  }, [session]);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    session,
    loading,
    error,
    login,
    logout,
    refreshSession,
    clearError,
    isSessionValid,
  };
}
