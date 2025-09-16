"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput } from "@/components/ui/PinInput";
import { toast } from "sonner";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { Lock, Eye, EyeOff, Loader2, Shield, CheckCircle, KeyRound } from "lucide-react";

function FirstLoginChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, login, refreshSession } = useEdgeAuthContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [formData, setFormData] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });

  const [pinStrength, setPinStrength] = useState({
    length: false,
    numbers: false,
  });

  // Vérifier si l'utilisateur doit changer son code PIN
  useEffect(() => {
    if (session?.admin?.require_password_change === false) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  // Calculer la force du code PIN
  useEffect(() => {
    const pin = formData.newPin;
    setPinStrength({
      length: pin.length === 6,
      numbers: /^\d+$/.test(pin),
    });
  }, [formData.newPin]);

  const isPinValid = Object.values(pinStrength).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.currentPin ||
      !formData.newPin ||
      !formData.confirmPin
    ) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (formData.newPin !== formData.confirmPin) {
      toast.error("Les nouveaux codes PIN ne correspondent pas");
      return;
    }

    if (!isPinValid) {
      toast.error("Le code PIN ne respecte pas les critères de sécurité");
      return;
    }

    if (!session?.admin?.email) {
      toast.error("Session non valide");
      return;
    }

    setIsLoading(true);
    try {
      // Utiliser directement le token d'accès de la session actuelle
      if (!session?.access_token) {
        throw new Error("Session non valide");
      }

      const changeResponse = await edgeFunctionService.changePassword(
        session.access_token,
        {
          current_password: formData.currentPin,
          new_password: formData.newPin,
          confirm_password: formData.confirmPin,
        }
      );

      if (changeResponse.success) {
        toast.success(
          "Code PIN changé avec succès. Vous allez être redirigé vers le dashboard."
        );

        // Forcer le rafraîchissement de la session pour mettre à jour require_password_change
        try {
          await refreshSession();
          console.log("Session rafraîchie avec succès");
        } catch (refreshError) {
          console.log(
            "Erreur lors du rafraîchissement de session:",
            refreshError
          );
          // Essayer de rafraîchir manuellement
          try {
            const refreshResponse = await edgeFunctionService.getMe(
              session.access_token
            );
            if (refreshResponse.success && refreshResponse.data) {
              const newSessionData = {
                user: {
                  id: refreshResponse.data.user.id,
                  email: refreshResponse.data.user.email,
                },
                admin: refreshResponse.data.user,
                partner: refreshResponse.data.partner_info,
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              };

              // Sauvegarder la session mise à jour
              localStorage.setItem(
                "partner_session",
                JSON.stringify(newSessionData)
              );

              // Forcer la mise à jour du contexte
              window.location.reload();
            }
          } catch (manualRefreshError) {
            console.log(
              "Erreur lors du rafraîchissement manuel:",
              manualRefreshError
            );
          }
        }

        // Rediriger vers le dashboard après un délai
        setTimeout(() => {
          router.replace("/dashboard");
        }, 2000);
      } else {
        throw new Error(
          changeResponse.message || "Erreur lors du changement de code PIN"
        );
      }
    } catch (error: any) {
      console.error("Erreur lors du changement de code PIN:", error);

      // Si l'erreur indique un problème de token, essayer de se reconnecter
      if (
        error.message?.includes("Session expirée") ||
        error.message?.includes("401")
      ) {
        try {
          console.log("Tentative de reconnexion...");
          const loginResponse = await edgeFunctionService.login({
            email: session.admin.email,
            password: formData.currentPin,
          });

          if (loginResponse.success && loginResponse.access_token) {
            // Réessayer avec le nouveau token
            const retryResponse = await edgeFunctionService.changePassword(
              loginResponse.access_token,
              {
                current_password: formData.currentPin,
                new_password: formData.newPin,
                confirm_password: formData.confirmPin,
              }
            );

            if (retryResponse.success) {
              toast.success(
                "Code PIN changé avec succès. Vous allez être redirigé vers le dashboard."
              );

              // Mettre à jour la session
              if (loginResponse.user && loginResponse.partner_info) {
                const newSessionData = {
                  user: {
                    id: loginResponse.user.id,
                    email: loginResponse.user.email,
                  },
                  admin: loginResponse.user,
                  partner: loginResponse.partner_info,
                  access_token: loginResponse.access_token,
                  refresh_token: loginResponse.refresh_token || "",
                };

                localStorage.setItem(
                  "partner_session",
                  JSON.stringify(newSessionData)
                );

                // Forcer la mise à jour du contexte
                window.location.reload();
              }

              setTimeout(() => {
                router.replace("/dashboard");
              }, 2000);
              return;
            }
          }
        } catch (retryError: any) {
          console.error(
            "Erreur lors de la tentative de reconnexion:",
            retryError
          );
          toast.error("Code PIN actuel incorrect ou erreur de connexion");
          return;
        }
      }

      toast.error(error.message || "Erreur lors du changement de code PIN");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.admin?.require_password_change) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Premier accès
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Pour des raisons de sécurité, vous devez changer votre code PIN
            avant de continuer.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code PIN actuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Code PIN actuel
              </label>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-400" />
                <PinInput
                  value={formData.currentPin}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      currentPin: value,
                    })
                  }
                  masked={!showCurrentPin}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {showCurrentPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Nouveau code PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Nouveau code PIN
              </label>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-400" />
                <PinInput
                  value={formData.newPin}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      newPin: value,
                    })
                  }
                  masked={!showNewPin}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {showNewPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmation du nouveau code PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Confirmer le nouveau code PIN
              </label>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-400" />
                <PinInput
                  value={formData.confirmPin}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      confirmPin: value,
                    })
                  }
                  masked={!showConfirmPin}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {showConfirmPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Critères de sécurité */}
            {formData.newPin && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Critères de sécurité :
                </p>
                <div className="space-y-1">
                  {Object.entries(pinStrength).map(([key, valid]) => (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle
                        className={`h-3 w-3 ${
                          valid ? "text-green-500" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          valid
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {key === "length" && "Exactement 6 chiffres"}
                        {key === "numbers" && "Uniquement des chiffres"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton de soumission */}
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.currentPin ||
                !formData.newPin ||
                !formData.confirmPin ||
                !isPinValid
              }
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Changement en cours...
                </>
              ) : (
                "Changer le code PIN"
              )}
            </Button>
          </form>

          {/* Informations supplémentaires */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              En changeant votre code PIN, vous acceptez les conditions
              d'utilisation de ZaLaMa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FirstLoginChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Chargement...</span>
          </div>
        </div>
      }
    >
      <FirstLoginChangePasswordContent />
    </Suspense>
  );
}
