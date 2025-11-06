"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X, Clock, DollarSign } from "lucide-react";

interface AlertModalWrapperProps {
  children: React.ReactNode;
  paymentStats?: {
    jours_restants_remboursement?: number | null;
    semaines_retard?: number;
    penalite_retard_pourcentage?: number;
    montant_penalite_retard?: number;
    montant_total_avec_penalite?: number;
    montant_total_remboursements?: number;
    delai_remboursement?: string;
  } | null;
}

export default function AlertModalWrapper({ children, paymentStats }: AlertModalWrapperProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Formater les montants
  const formatAmount = (amount: number | undefined | null) => {
    if (!amount || isNaN(amount)) return '0';
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  // Formater la date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    // Vérifier si le partenaire est en retard
    const enRetard = paymentStats?.jours_restants_remboursement !== null && 
                     paymentStats?.jours_restants_remboursement !== undefined &&
                     paymentStats.jours_restants_remboursement < 0;

    // Afficher le modal uniquement si:
    // 1. En retard
    // 2. Pas encore affiché dans cette session
    // 3. Les données sont chargées
    if (enRetard && !hasShownOnce && paymentStats) {
      // Attendre 1 seconde après le chargement pour un effet plus smooth
      const timer = setTimeout(() => {
        setShowAlert(true);
        setHasShownOnce(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [paymentStats, hasShownOnce]);

  const handleClose = () => {
    setShowAlert(false);
  };

  const joursRetard = paymentStats?.jours_restants_remboursement 
    ? Math.abs(paymentStats.jours_restants_remboursement) 
    : 0;

  return (
    <>
      {children}

      {/* Modal d'alerte de retard */}
      {showAlert && paymentStats && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[var(--zalama-bg-darker)] border border-gray-200 dark:border-[var(--zalama-border)] rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header élégant */}
            <div className="relative p-6 pb-4 border-b border-gray-200 dark:border-[var(--zalama-border)]/30">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                    <Clock className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Échéance de remboursement
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Information importante concernant vos paiements
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Message principal - plus subtil */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed">
                    Le délai de remboursement de <strong>{joursRetard} jours</strong> est dépassé ({paymentStats.semaines_retard || 0} semaine{(paymentStats.semaines_retard || 0) > 1 ? 's' : ''}) pour vos paiements effectués par ZaLaMa.
                  </p>
                </div>
              </div>

              {/* Détails financiers - design épuré */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Montant de base
                  </span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatAmount(paymentStats.montant_total_remboursements)} GNF
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Pénalité de retard
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                      +{paymentStats.penalite_retard_pourcentage || 0}%
                    </span>
                  </div>
                  <span className="text-base font-semibold text-orange-600 dark:text-orange-400">
                    +{formatAmount(paymentStats.montant_penalite_retard)} GNF
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Montant total
                  </span>
                  <span className="text-2xl font-bold" style={{ color: "var(--zalama-orange)" }}>
                    {formatAmount(paymentStats.montant_total_avec_penalite)} GNF
                  </span>
                </div>
              </div>

              {/* Date limite - design minimaliste */}
              {paymentStats.delai_remboursement && (
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Échéance dépassée le
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(paymentStats.delai_remboursement)}
                  </span>
                </div>
              )}

              {/* Info pénalité progressive */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💡 La pénalité augmente de <strong>1%</strong> par semaine de retard supplémentaire.
                </p>
              </div>
            </div>

            {/* Footer - design épuré */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Affiché une seule fois par session
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow"
                style={{ 
                  background: "var(--zalama-orange)",
                  color: "white"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--zalama-orange)'}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

