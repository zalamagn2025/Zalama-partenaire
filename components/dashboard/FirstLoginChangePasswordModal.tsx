"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/PinInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useChangePassword } from "@/hooks/useAuth";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  KeyRound,
  Lock,
} from "lucide-react";

interface FirstLoginChangePasswordModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FirstLoginChangePasswordModal({
  open,
  onOpenChange,
}: FirstLoginChangePasswordModalProps) {
  const router = useRouter();
  const { session, refreshSession } = useEdgeAuthContext();
  const changePasswordMutation = useChangePassword();

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
      toast.error("Le code PIN doit contenir exactement 6 chiffres");
      return;
    }

    // Validation supplémentaire pour s'assurer que c'est bien un code PIN
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(formData.newPin)) {
      toast.error("Le code PIN doit contenir exactement 6 chiffres");
      return;
    }

    if (!pinRegex.test(formData.confirmPin)) {
      toast.error("Le code PIN de confirmation doit contenir exactement 6 chiffres");
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

      const changeResponse = await changePasswordMutation.mutateAsync({
        currentPassword: formData.currentPin,
        newPassword: formData.newPin,
      });

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
        }

        // Fermer la modal et recharger la page après un délai
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(
          changeResponse.message || "Erreur lors du changement de code PIN"
        );
      }
    } catch (error: any) {
      console.error("Erreur lors du changement de code PIN:", error);

      // Si l'erreur indique un problème de token, afficher un message d'erreur
      if (
        error.message?.includes("Session expirée") ||
        error.message?.includes("401") ||
        error.message?.includes("Unauthorized")
      ) {
        toast.error("Votre session a expiré. Veuillez vous reconnecter.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      // Afficher l'erreur générique
      const errorMessage = error?.message || error?.data?.message || "Erreur lors du changement de code PIN";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isRequired = session?.admin?.require_password_change === true;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Si le changement de mot de passe est requis, on ne peut pas fermer la modal
        if (isRequired && !newOpen) {
          return;
        }
        onOpenChange?.(newOpen);
      }}
    >
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onInteractOutside={(e) => {
          // Empêcher la fermeture en cliquant à l'extérieur
          if (isRequired) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Empêcher la fermeture avec Escape
          if (isRequired) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Premier accès
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            Pour des raisons de sécurité, vous devez changer votre code PIN
            avant de continuer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
      </DialogContent>
    </Dialog>
  );
}

