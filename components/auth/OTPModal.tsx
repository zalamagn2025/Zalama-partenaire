// FONCTIONNALITÉ OTP TEMPORAIREMENT DÉSACTIVÉE
// Ce composant a été mis de côté pour le moment

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Fonctionnalité temporairement indisponible</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La fonctionnalité de vérification par code OTP a été temporairement
            désactivée.
          </p>
          <p className="text-sm text-muted-foreground">
            Veuillez utiliser la méthode de connexion standard.
          </p>
          <Button onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
