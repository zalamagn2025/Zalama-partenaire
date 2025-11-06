"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return; // S'assurer d'être côté client
    
    // Vérifier si l'utilisateur est connecté via localStorage
    const savedSession = localStorage.getItem('zalama_session');
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session && session.partner) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('zalama_session');
      }
    }
    
    // Si pas de session valide, rediriger vers login
    router.replace("/login");
  }, [router]);

  // Afficher un écran de chargement pendant la redirection
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <Image
          src="/images/Logo.svg"
          alt="ZaLaMa Logo"
          width={150}
          height={150}
          className="mx-auto"
        />
      </div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Chargement en cours...</p>
    </div>
  );
}
