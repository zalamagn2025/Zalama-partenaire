"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  phone?: string;
  onOTPVerified: (email: string) => void;
}

export default function OTPModal({
  isOpen,
  onClose,
  email,
  phone,
  onOTPVerified,
}: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const initialOTPSentRef = useRef(false);

  // Timer pour le compte à rebours
  useEffect(() => {
    if (isOpen && timeLeft > 0 && otpSent) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, timeLeft, otpSent]);

  // Envoyer l'OTP initial seulement une fois quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && email && !otpSent && !initialOTPSentRef.current) {
      initialOTPSentRef.current = true;
      sendOTP();
    }
  }, [isOpen, email]);

  // Réinitialiser l'état quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError(null);
      setTimeLeft(120);
      setCanResend(false);
      setIsSendingOTP(false);
      setOtpSent(false);
      setVerificationStatus("idle");
      initialOTPSentRef.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isOpen]);

  // Focus sur le premier input quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const sendOTP = async () => {
    if (isSendingOTP) {
      console.log("⚠️ Envoi OTP déjà en cours, ignoré");
      return;
    }

    try {
      console.log("📧 Début envoi OTP...");
      setIsSendingOTP(true);
      setError(null);

      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du code");
      }

      console.log("✅ OTP envoyé avec succès");
      toast.success(
        "Code de vérification envoyé par email" + (phone ? " et SMS" : "")
      );

      setOtpSent(true);
      setTimeLeft(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);

      // Récupérer et afficher l'OTP dans la console pour le débogage
      getLatestOTP();
    } catch (error: any) {
      console.error("❌ Erreur envoi OTP:", error);
      setError(error.message);
      toast.error(error.message);
      initialOTPSentRef.current = false;
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Fonction pour récupérer l'OTP depuis la base de données (débogage)
  const getLatestOTP = async () => {
    try {
      const response = await fetch("/api/otp/get-latest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.otp) {
          console.log("🔐 OTP pour le débogage:", data.otp);
          console.log("📧 Email:", email);
          console.log("⏰ Expire à:", data.expiresAt);
        }
      }
    } catch (error) {
      console.error("Erreur récupération OTP:", error);
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationStatus("verifying");

      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la vérification");
      }

      setVerificationStatus("success");
      toast.success("Code de vérification validé !");

      // Attendre un court délai pour montrer le succès
      setTimeout(() => {
        onOTPVerified(email);
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Erreur vérification OTP:", error);
      setError(error.message);
      setVerificationStatus("error");
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    // Ne permettre que les chiffres
    const numericValue = value.replace(/\D/g, "");

    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);
      setError(null);

      // Passer au champ suivant si un chiffre est entré
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Retour en arrière
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Entrée pour vérifier
    if (e.key === "Enter" && otp.join("").length === 6 && !isLoading) {
      verifyOTP();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");

    if (pastedData.length === 6) {
      const newOtp = pastedData.split("").slice(0, 6);
      setOtp(newOtp);
      setError(null);

      // Focus sur le dernier champ
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = () => {
    if (canResend && !isSendingOTP) {
      sendOTP();
    }
  };

  const isOtpComplete = otp.join("").length === 6;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Vérification en deux étapes
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mt-2">
            Nous avons envoyé un code de vérification à{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {email}
            </span>
            {phone && (
              <>
                {" "}
                et{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {phone}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 dark:bg-red-900/20"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {verificationStatus === "success" && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                Code vérifié avec succès ! Redirection en cours...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Code de vérification
            </Label>

            {/* Champs OTP */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <div key={index} className="relative">
                  <Input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg transition-all duration-200 ${
                      digit
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    } ${
                      verificationStatus === "success"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : ""
                    }`}
                    disabled={isLoading || verificationStatus === "success"}
                  />
                  {index < 5 && (
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Entrez le code à 6 chiffres reçu
            </p>
          </div>

          <div className="space-y-4">
            {otpSent && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Code valide pendant :{" "}
                  </span>
                  <span
                    className={`font-mono font-bold text-lg ${
                      timeLeft < 30 ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {canResend && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={isSendingOTP}
                    className="w-full"
                  >
                    {isSendingOTP ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Renvoyer le code
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading || verificationStatus === "success"}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={verifyOTP}
                disabled={
                  !isOtpComplete ||
                  isLoading ||
                  verificationStatus === "success"
                }
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
