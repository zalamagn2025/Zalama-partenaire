"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { session, loading, error } = useAuth();
  const router = useRouter();

  // Si on a une session, afficher immédiatement (pas de rechargement)
  if (session) {
    return <>{children}</>;
  }

  // Pendant le chargement, afficher le fallback
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Si pas de session et pas en chargement, rediriger
  useEffect(() => {
    if (!loading && !session) {
      router.push(redirectTo);
    }
  }, [session, loading, router, redirectTo]);

  // Affichage d'erreur si problème d'authentification
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">
            Erreur d'authentification
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  // Redirection en cours
  return fallback || (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
