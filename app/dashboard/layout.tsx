"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EntrepriseSidebar from '@/components/layout/EntrepriseSidebar';
import EntrepriseHeader from '@/components/layout/EntrepriseHeader';
import '@/styles/zalama-theme.css';

export default function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  // Protection côté client - redirection si non authentifié
  useEffect(() => {
    if (!loading) {
      if (!session) {
        console.log('No session found, redirecting to login');
        router.replace('/login');
        return;
      }

      if (!session.admin || !session.partner) {
        console.log('Incomplete session, redirecting to login');
        router.replace('/login');
        return;
      }

      console.log('Session valid, allowing access to dashboard');
    }
  }, [session, loading, router]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // Si pas de session, ne rien afficher (redirection en cours)
  if (!session || !session.admin || !session.partner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirection...</p>
        </div>
      </div>
    );
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