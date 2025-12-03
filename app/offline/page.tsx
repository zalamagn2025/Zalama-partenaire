"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      window.location.href = "/dashboard";
    }
  }, [isOnline]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative w-24 h-24">
            <Image
              src="/images/Logo.svg"
              alt="ZaLaMa Logo"
              width={96}
              height={96}
              className="mx-auto"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full">
            <WifiOff className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Vous êtes hors ligne
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Il semble que vous n'ayez pas de connexion internet. Veuillez vérifier
          votre connexion et réessayer.
        </p>

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              } animate-pulse`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isOnline ? "Connexion rétablie" : "Aucune connexion"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            className="w-full"
            size="lg"
            disabled={!isOnline}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Button>
        </div>

        <div className="mt-8 text-left">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Que faire ?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>Vérifiez votre connexion Wi-Fi ou données mobiles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>Activez le mode avion puis désactivez-le</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>Redémarrez votre routeur si nécessaire</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>Contactez votre fournisseur d'accès internet</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            💡 <strong>Astuce :</strong> Certaines pages peuvent être disponibles
            hors ligne grâce au cache de l'application.
          </p>
        </div>
      </div>
    </div>
  );
}
