"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OTPModal from "@/components/auth/OTPModal";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { verifyCredentials, signInWithOTP, session, loading } = useAuth();
  const router = useRouter();

  // Redirection automatique si déjà connecté (seulement si pas en train de vérifier OTP)
  React.useEffect(() => {
    if (
      !loading &&
      session?.admin &&
      session?.partner &&
      !isVerifyingOTP &&
      !isRedirecting
    ) {
      console.log("User already authenticated, redirecting to dashboard");
      toast.success("Redirection vers le dashboard...");
      router.push("/dashboard");
    }
  }, [session, loading, router, isVerifyingOTP, isRedirecting]);

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

  // Afficher un loader si on redirige après vérification OTP
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Connexion réussie ! Redirection vers le dashboard...
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier les identifiants sans se connecter
      const { error, user } = await verifyCredentials(email, password);

      if (error) {
        console.error("Erreur de vérification:", error);
        toast.error(error.message || "Erreur de vérification");
      } else if (user) {
        // Les identifiants sont corrects, afficher la modal OTP
        setPendingEmail(email);
        setPendingPassword(password);
        setShowOTPModal(true);
        setIsVerifyingOTP(true); // Empêcher la redirection automatique
        toast.success(
          "Identifiants vérifiés. Veuillez entrer le code de vérification."
        );
      }
    } catch (error) {
      console.error("Erreur de vérification:", error);
      toast.error("Une erreur est survenue lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async (verifiedEmail: string) => {
    try {
      setIsLoading(true);
      setIsRedirecting(true);

      // Maintenant que l'OTP est vérifié, procéder à la connexion finale
      const { error, session: newSession } = await signInWithOTP(
        pendingEmail,
        pendingPassword
      );

      if (error) {
        console.error("Erreur de connexion finale:", error);
        toast.error(error.message || "Erreur de connexion");
        setIsVerifyingOTP(false);
        setIsRedirecting(false);
      } else if (newSession) {
        toast.success(
          `Connexion réussie ! Bienvenue ${newSession.admin.display_name}`
        );

        // Attendre un court délai pour s'assurer que la session est bien stockée
        setTimeout(() => {
          console.log("Redirecting to dashboard...");
          setIsVerifyingOTP(false);
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Erreur de connexion finale:", error);
      toast.error("Une erreur est survenue lors de la connexion");
      setIsVerifyingOTP(false);
      setIsRedirecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPModalClose = () => {
    setShowOTPModal(false);
    setIsVerifyingOTP(false); // Réactiver la redirection automatique
  };

  const createTestUsers = async () => {
    try {
      setIsLoading(true);
      toast.info("Création des utilisateurs de test en cours...");

      // Appeler l'API pour créer les utilisateurs
      const response = await fetch("/api/create-test-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Utilisateurs de test créés avec succès !");
      } else {
        const error = await response.text();
        toast.error(`Erreur : ${error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la création des utilisateurs:", error);
      toast.error("Erreur lors de la création des utilisateurs de test");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Connexion
            </CardTitle>
            <CardDescription>
              Utilisez vos identifiants administrateur pour accéder au dashboard
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isVerifyingOTP}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isVerifyingOTP}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isVerifyingOTP}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <p>
                    Seuls les utilisateurs avec les rôles <strong>RH</strong> ou{" "}
                    <strong>Responsable</strong> peuvent accéder au dashboard.
                  </p>
                  <p className="mt-2 text-sm">
                    <strong>Note :</strong> Une vérification en deux étapes sera
                    requise après la connexion.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isVerifyingOTP}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
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
      </div>

      {/* Modal OTP */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={handleOTPModalClose}
        email={pendingEmail}
        onOTPVerified={handleOTPVerified}
      />
    </div>
  );
}
