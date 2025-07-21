"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";

// Fonction utilitaire pour calculer la force du mot de passe
function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (score <= 1) return { label: "Faible", color: "bg-red-500", value: 1 };
  if (score === 2 || score === 3) return { label: "Moyen", color: "bg-yellow-500", value: 2 };
  return { label: "Élevé", color: "bg-green-600", value: 3 };
}

export default function FirstLoginChangePasswordPage() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session?.admin) {
    // Si pas de session admin, rediriger vers login
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Mettre à jour le mot de passe dans Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;
      // 2. Mettre à jour require_password_change à false dans admin_users
      const { error: dbError } = await supabase
        .from("admin_users")
        .update({ require_password_change: false, updated_at: new Date().toISOString() })
        .eq("id", session.admin.id);
      if (dbError) throw dbError;
      toast.success("Mot de passe modifié avec succès. Veuillez vous reconnecter.");
      await signOut();
      router.replace("/login");
      return;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Changement de mot de passe obligatoire</CardTitle>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4 mb-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
              Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant d'accéder au dashboard.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-400"
                  onClick={() => setShowNewPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Indicateur de force du mot de passe */}
              {newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-28 h-2 rounded bg-gray-200 overflow-hidden">
                    <div className={`h-2 rounded ${strength.color}`} style={{ width: strength.value === 1 ? '33%' : strength.value === 2 ? '66%' : '100%' }} />
                  </div>
                  <span className={`text-xs font-semibold ${strength.color.replace('bg-', 'text-')}`}>Sécurité: {strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-400"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Changement..." : "Changer le mot de passe"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={signOut} disabled={isSubmitting}>
              Se déconnecter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 