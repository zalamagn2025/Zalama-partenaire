"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EntrepriseSidebar from '@/components/layout/EntrepriseSidebar';
import EntrepriseHeader from '@/components/layout/EntrepriseHeader';
import '@/styles/zalama-theme.css';

export default function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Protection côté client - mais plus intelligente
  useEffect(() => {
    if (!loading) {
      // Attendre un peu pour s'assurer que la session est complètement chargée
      const timer = setTimeout(() => {
        if (!session) {
          console.log('No session found after initialization, redirecting to login');
          router.replace('/login');
          return;
        }

        if (!session.admin || !session.partner) {
          console.log('Incomplete session after initialization, redirecting to login');
          router.replace('/login');
          return;
        }

        console.log('Session validated, dashboard access granted');
        setIsInitialized(true);
      }, 100); // Petit délai pour éviter les redirections prématurées

      return () => clearTimeout(timer);
    }
  }, [session, loading, router]);

  // Afficher un loader pendant la vérification initiale
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {loading ? 'Vérification de la session...' : 'Initialisation du dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Si toujours pas de session après initialisation, ne rien afficher (redirection en cours)
  if (!session || !session.admin || !session.partner) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <EntrepriseSidebar />
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--current-sidebar-width, var(--sidebar-width))' }}>
        <EntrepriseHeader />
        <main className="flex-1 mb-8 overflow-y-auto px-6 text-gray-900 dark:text-white" style={{scrollbarWidth: "none"}}>
            {children}
        </main>
      </div>
    </div>
  );
}