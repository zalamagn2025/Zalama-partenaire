"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return; // S'assurer d'être côté client
    if (!loading) {
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [session, loading, router]);

  // Afficher un écran de chargement pendant la redirection
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <Image
          src="/images/logo_vertical.svg"
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
