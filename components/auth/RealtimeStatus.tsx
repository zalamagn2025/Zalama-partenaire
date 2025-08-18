"use client";

import { Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface RealtimeStatusProps {
  session: any;
}

export default function RealtimeStatus({ session }: RealtimeStatusProps) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [status, setStatus] = useState<"active" | "inactive" | "error">(
    "inactive"
  );

  useEffect(() => {
    if (session?.access_token) {
      setStatus("active");
      setLastRefresh(new Date());

      // Calculer le prochain refresh (8 minutes)
      const next = new Date();
      next.setMinutes(next.getMinutes() + 8);
      setNextRefresh(next);
    } else {
      setStatus("inactive");
      setLastRefresh(null);
      setNextRefresh(null);
    }
  }, [session?.access_token]);

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <Wifi className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeUntilNextRefresh = () => {
    if (!nextRefresh) return "";

    const now = new Date();
    const diff = nextRefresh.getTime() - now.getTime();

    if (diff <= 0) return "Maintenant";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Statut de la session
        </h3>
        <div className={`flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-xs font-medium">
            {status === "active"
              ? "Actif"
              : status === "error"
              ? "Erreur"
              : "Inactif"}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>Refresh automatique :</span>
          <span className="font-medium">
            {status === "active" ? "Toutes les 8 min" : "Désactivé"}
          </span>
        </div>

        {lastRefresh && (
          <div className="flex items-center justify-between">
            <span>Dernier refresh :</span>
            <span className="font-medium">{formatTime(lastRefresh)}</span>
          </div>
        )}

        {nextRefresh && status === "active" && (
          <div className="flex items-center justify-between">
            <span>Prochain refresh :</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {getTimeUntilNextRefresh()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Expiration token :</span>
          <span className="font-medium">10 minutes</span>
        </div>

        {/* Informations de débogage du partenaire */}
        {session?.partner && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span>Partenaire :</span>
                <span className="font-medium">
                  {session.partner.company_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>ID Partenaire :</span>
                <span className="font-medium text-xs">
                  {session.partner.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Date création (session) :</span>
                <span className="font-medium">
                  {session.partner.created_at
                    ? new Date(session.partner.created_at).toLocaleDateString(
                        "fr-FR"
                      )
                    : "Non disponible"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {status === "active" && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-700 dark:text-green-300">
              Session maintenue automatiquement
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
