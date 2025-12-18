"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  Shield,
  Loader2,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/ui/PinInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useForgotPassword } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const { login, session, loading } = useEdgeAuthContext();
  const forgotPasswordMutation = useForgotPassword();
  const router = useRouter();

  // Redirection automatique si déjà connecté (une seule fois)
  // Pour les gestionnaires/RH/responsables, on vérifie qu'ils ont un partner_info
  React.useEffect(() => {
    if (!loading && session?.user && session?.partner && !hasRedirected) {
      console.log("User already authenticated, redirecting to dashboard");
      setHasRedirected(true);
      toast.success("Redirection vers le dashboard...");
      router.push("/dashboard");
    }
  }, [session, loading, router, hasRedirected]);

  // Afficher un loader si on vérifie la session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Vérification de la session...
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Réinitialiser les erreurs
    setEmailError("");
    setPinError("");

    // Validation des champs
    let hasErrors = false;

    if (!email) {
      setEmailError("L'adresse email est requise");
      hasErrors = true;
    } else if (!email.includes("@")) {
      setEmailError("Veuillez saisir une adresse email valide");
      hasErrors = true;
    }

    if (!pinCode) {
      setPinError("Le code PIN est requis");
      hasErrors = true;
    } else if (pinCode.length !== 6) {
      setPinError("Le code PIN doit contenir exactement 6 chiffres");
      hasErrors = true;
    } else if (!/^\d{6}$/.test(pinCode)) {
      setPinError("Le code PIN doit contenir uniquement des chiffres");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setIsLoading(true);

    try {
      // Connexion via l'API ZaLaMa pour gestionnaires/RH/responsables
      const { error, session: newSession } = await login({ email, password: pinCode });

      if (error) {
        console.error("Erreur de connexion:", error);
        console.error("Détails de l'erreur:", {
          message: error.message,
          statusCode: error.statusCode,
          data: error.data,
        });
        
        // Afficher des messages d'erreur plus spécifiques
        let errorMessage = error.message || "Erreur de connexion";
        
        // Si l'erreur contient des données supplémentaires, les utiliser
        if (error.data?.message) {
          errorMessage = error.data.message;
        } else if (error.data?.error) {
          errorMessage = error.data.error;
        }

        // Personnaliser les messages d'erreur
        if (
          errorMessage.toLowerCase().includes("email") ||
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("mot de passe") ||
          errorMessage.toLowerCase().includes("incorrect") ||
          errorMessage.toLowerCase().includes("invalid")
        ) {
          errorMessage =
            "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
        } else if (errorMessage.toLowerCase().includes("token jwt")) {
          // Pour une requête de login, ce message est trompeur
          errorMessage = "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
        } else if (errorMessage.toLowerCase().includes("session expirée")) {
          errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
        } else if (errorMessage.toLowerCase().includes("non autorisé") || errorMessage.toLowerCase().includes("unauthorized")) {
          errorMessage = "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
        }

        toast.error(errorMessage);
        setPinError("Identifiants incorrects");
      } else if (newSession) {
        // Afficher le nom de l'utilisateur (gestionnaire/RH/responsable)
        const userName = newSession.user?.email || 
                        (newSession.admin?.display_name) || 
                        (newSession.admin?.firstName && newSession.admin?.lastName 
                          ? `${newSession.admin.firstName} ${newSession.admin.lastName}` 
                          : 'Utilisateur');
        toast.success(`Connexion réussie ! Bienvenue ${userName}`);
        // La redirection se fera automatiquement via le useEffect
        setHasRedirected(true);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Une erreur est survenue lors de la connexion");
      setPinError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error("Veuillez saisir votre adresse email");
      return;
    }

    setIsResettingPin(true);

    try {
      const response = await forgotPasswordMutation.mutateAsync(resetEmail);

      if (response.success) {
        toast.success("Email de réinitialisation du code PIN envoyé avec succès");
        setShowForgotPin(false);
        setResetEmail("");
      } else {
        throw new Error(
          response.message || "Erreur lors de l'envoi de l'email"
        );
      }
    } catch (error: any) {
      console.error("Erreur lors de la réinitialisation:", error);
      toast.error(
        error.message || "Erreur lors de l'envoi de l'email de réinitialisation du code PIN"
      );
    } finally {
      setIsResettingPin(false);
    }
  };

  // Fonction supprimée - l'API create-test-users a été supprimée

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        {!showForgotPin ? (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-6">
                <img 
                  src="/images/Logo.svg" 
                  alt="ZaLaMa Logo" 
                  className="h-16 w-auto"
                  onError={(e) => {
                    // Fallback si le logo SVG n'existe pas
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/logo-fav.png";
                  }}
                />
              </div>
              <CardTitle className="text-center text-2xl font-bold">
                Connexion
              </CardTitle>
              <CardDescription>
                Utilisez vos identifiants administrateur pour accéder au
                dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    required
                    disabled={isLoading}
                    className={emailError ? "border-red-500" : "focus-visible:border-[var(--zalama-orange)] focus-visible:ring-orange-500/50"}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pin">Code PIN</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setShowPin(!showPin)}
                      disabled={isLoading}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <PinInput
                    value={pinCode}
                    onChange={setPinCode}
                    length={6}
                    disabled={isLoading}
                    error={!!pinError}
                    masked={!showPin}
                    className="mt-4"
                  />
                  {pinError && (
                    <p className="text-sm text-red-500 mt-2 text-center">{pinError}</p>
                  )}
                </div>

                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setShowForgotPin(true)}
                    disabled={isLoading}
                  >
                    Code PIN oublié ?
                  </Button>
                </div>

                <Alert className="mt-4">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <p>
                      Seuls les utilisateurs avec les rôles <strong>RH</strong>{" "}
                      ou <strong>Responsable</strong> peuvent accéder au
                      dashboard.
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Note :</strong> Une vérification en deux étapes
                      sera requise après la connexion.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 mt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-[var(--zalama-orange)] hover:bg-orange-600 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Se connecter
                    </div>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-6">
                <img 
                  src="/images/Logo.svg" 
                  alt="ZaLaMa Logo" 
                  className="h-16 w-auto"
                  onError={(e) => {
                    // Fallback si le logo SVG n'existe pas
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/logo-fav.png";
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPin(false)}
                  disabled={isResettingPin}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-center text-2xl font-bold">
                    Code PIN oublié
                  </CardTitle>
                  <CardDescription>
                    Entrez votre adresse email pour recevoir un lien de
                    réinitialisation de votre code PIN
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleForgotPin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Adresse email</Label>
                  <div className="relative">
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isResettingPin}
                      className="focus-visible:border-[var(--zalama-orange)] focus-visible:ring-orange-500/50"
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <Alert className="mt-4">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <p>
                      Un email contenant un lien de réinitialisation de votre code PIN sera envoyé
                      à votre adresse email.
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Note :</strong> Vérifiez votre dossier spam si
                      vous ne recevez pas l'email.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 mt-4">
                <Button
                  type="submit"
                  className="w-full bg-[var(--zalama-orange)] hover:bg-orange-600 text-white"
                  disabled={isResettingPin}
                >
                  {isResettingPin ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Envoyer l'email de réinitialisation du code PIN
                    </div>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
