"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      toast.error("Vous devez être connecté pour accéder à cette page");
      router.push("/login");
    }
  }, [session, loading, router]);

  // Afficher un loader pendant la vérification de la session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Si pas de session, ne rien afficher (la redirection se fait dans le useEffect)
  if (!session) {
    return null;
  }

  // Si on a une session, afficher le contenu protégé
  return <>{children}</>;
}
