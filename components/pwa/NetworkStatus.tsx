"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/usePWA";

export default function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const [showOffline, setShowOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Toujours masquer après 2s, et éviter les timers concurrents
  const scheduleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = window.setTimeout(() => {
      setShowOffline(false);
      setShowOnline(false);
      timeoutRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    // Nettoyage à l'unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setShowOnline(false);
      setShowOffline(true);
      scheduleHide();
    } else {
      setShowOffline(false);
      setShowOnline(true);
      scheduleHide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  if (showOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 shadow-lg animate-slide-down">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">
            Vous êtes hors ligne - Certaines fonctionnalités peuvent être limitées
            Vous êtes hors ligne
          </span>
        </div>
      </div>
    );
  }

  if (showOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-2 px-4 shadow-lg animate-slide-down">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Wifi className="w-5 h-5" />
          <span className="text-sm font-medium">
            Connexion rétablie
          </span>
        </div>
      </div>
    );
  }

  return null;
}
