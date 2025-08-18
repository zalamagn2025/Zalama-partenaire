"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import { Loader2, Mail, RefreshCw, X } from "lucide-react";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  email: string;
  password: string;
}

export default function OTPModal({
  isOpen,
  onClose,
  onSuccess,
  email,
  password,
}: OTPModalProps) {
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Envoyer l'OTP au montage du modal
  useEffect(() => {
    if (isOpen && email && password) {
      sendOTP();
    }
  }, [isOpen, email, password]);

  // Timer pour le renvoi d'OTP
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await edgeFunctionService.sendOtp({
        email,
        password,
      });

      if (response.success && response.sessionId) {
        setSessionId(response.sessionId);
        setTimeLeft(60); // 60 secondes avant de pouvoir renvoyer
        toast.success("Code de vérification envoyé à votre email");
      } else {
        throw new Error(response.message || "Erreur lors de l'envoi du code");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de l'OTP:", error);
      toast.error(
        error.message || "Erreur lors de l'envoi du code de vérification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Veuillez entrer un code à 6 chiffres");
      return;
    }

    if (!sessionId) {
      toast.error("Session invalide. Veuillez réessayer.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await edgeFunctionService.verifyOtp({
        sessionId,
        otp,
      });

      if (response.success) {
        toast.success("Code de vérification validé avec succès");
        onSuccess(email);
        onClose();
      } else {
        throw new Error(response.message || "Code de vérification invalide");
      }
    } catch (error: any) {
      console.error("Erreur lors de la vérification de l'OTP:", error);
      toast.error(error.message || "Code de vérification invalide");
      setOtp(""); // Vider le champ en cas d'erreur
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOTP = async () => {
    if (timeLeft > 0) {
      toast.error(
        `Veuillez attendre ${timeLeft} secondes avant de renvoyer le code`
      );
      return;
    }

    setIsResending(true);
    try {
      await sendOTP();
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setOtp("");
    setSessionId("");
    setTimeLeft(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vérification en deux étapes</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message d'information */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Code de vérification envoyé
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nous avons envoyé un code de vérification à 6 chiffres à{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {email}
              </span>
            </p>
          </div>

          {/* Champ OTP */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Code de vérification
            </label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              placeholder="000000"
              className="text-center text-lg font-mono tracking-widest"
              maxLength={6}
              disabled={isVerifying}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Entrez le code à 6 chiffres reçu par email
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <Button
              onClick={verifyOTP}
              disabled={!otp || otp.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Vérification...
                </>
              ) : (
                "Vérifier le code"
              )}
            </Button>

            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                onClick={resendOTP}
                disabled={timeLeft > 0 || isResending}
                className="flex items-center gap-2"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {timeLeft > 0
                  ? `Renvoyer dans ${timeLeft}s`
                  : "Renvoyer le code"}
              </Button>
            </div>
          </div>

          {/* Conseils */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Conseil :</strong> Vérifiez votre dossier spam si vous
              ne recevez pas l'email dans les prochaines minutes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
