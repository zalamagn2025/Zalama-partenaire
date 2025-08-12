"use client";

import React, { useState, useEffect } from "react";
import { Mail, RotateCcw } from "lucide-react";
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
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer pour le compte à rebours
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOpen && timeLeft > 0) {
      interval = setInterval(() => {
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
      if (interval) clearInterval(interval);
    };
  }, [isOpen, timeLeft]);

  // Envoyer l'OTP initial
  useEffect(() => {
    if (isOpen && email) {
      sendOTP();
    }
  }, [isOpen, email]);

  const sendOTP = async () => {
    try {
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

      toast.success(
        "Code de vérification envoyé par email" + (phone ? " et SMS" : "")
      );
      setTimeLeft(120);
      setCanResend(false);
      setOtp("");
    } catch (error: any) {
      console.error("Erreur envoi OTP:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la vérification");
      }

      toast.success("Code de vérification validé !");
      onOTPVerified(email);
      onClose();
    } catch (error: any) {
      console.error("Erreur vérification OTP:", error);
      setError(error.message);
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

  const handleInputChange = (value: string) => {
    // Ne permettre que les chiffres
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 6) {
      setOtp(numericValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 6) {
      verifyOTP();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Vérification en deux étapes
          </DialogTitle>
          <DialogDescription>
            Nous avons envoyé un code de vérification à {email}
            {phone && ` et ${phone}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              disabled={isLoading}
            />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Code valide pendant :{" "}
              <span
                className={`font-mono ${
                  timeLeft < 30 ? "text-red-500" : "text-blue-500"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </p>

            {canResend && (
              <Button
                variant="outline"
                size="sm"
                onClick={sendOTP}
                disabled={isSendingOTP}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isSendingOTP ? "Envoi..." : "Renvoyer le code"}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={verifyOTP}
              disabled={otp.length !== 6 || isLoading}
              className="flex-1"
            >
              {isLoading ? "Vérification..." : "Vérifier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
