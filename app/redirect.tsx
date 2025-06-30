"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Cette page est utilisée pour forcer une redirection
export default function Redirect() {
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') || '/dashboard';

  useEffect(() => {
    // Forcer la redirection avec un délai pour s'assurer que tout est chargé
    const redirectTimer = setTimeout(() => {
      window.location.href = destination;
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [destination]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Redirection en cours...</p>
    </div>
  );
}
