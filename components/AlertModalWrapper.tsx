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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border-2 border-red-500 dark:border-red-600 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header rouge */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      ⚠️ Alerte de Retard
                    </h3>
                    <p className="text-red-100 text-sm mt-1">
                      Remboursement ZaLaMa en retard
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Message principal */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 text-base">
                  Vous avez <strong className="text-red-600 dark:text-red-400">{joursRetard} jours de retard</strong> sur le remboursement de vos paiements de salaires effectués par ZaLaMa.
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                  Cela correspond à <strong>{paymentStats.semaines_retard || 0} semaine{(paymentStats.semaines_retard || 0) > 1 ? 's' : ''} de retard</strong> après le délai autorisé de 2 semaines.
                </p>
              </div>

              {/* Détails des pénalités */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      Pénalité appliquée
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    +{paymentStats.penalite_retard_pourcentage || 0}%
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {paymentStats.semaines_retard || 0} semaine{(paymentStats.semaines_retard || 0) > 1 ? 's' : ''} × 1%
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">
                      Montant de la pénalité
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatAmount(paymentStats.montant_penalite_retard)} GNF
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Sur {formatAmount(paymentStats.montant_total_remboursements)} GNF
                  </p>
                </div>
              </div>

              {/* Total à payer */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">
                      Montant total à rembourser
                    </p>
                    <p className="text-3xl font-bold">
                      {formatAmount(paymentStats.montant_total_avec_penalite)} GNF
                    </p>
                    <p className="text-xs opacity-75 mt-2">
                      Incluant {formatAmount(paymentStats.montant_total_remboursements)} GNF de base + {formatAmount(paymentStats.montant_penalite_retard)} GNF de pénalité
                    </p>
                  </div>
                  <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-10 h-10" />
                  </div>
                </div>
              </div>

              {/* Date limite */}
              {paymentStats.delai_remboursement && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Date limite de remboursement dépassée :</strong>
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {formatDate(paymentStats.delai_remboursement)}
                  </p>
                </div>
              )}

              {/* Message d'action */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Action requise :</strong> Veuillez effectuer le remboursement dans les plus brefs délais pour éviter une augmentation de la pénalité.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Chaque semaine supplémentaire de retard ajoute <strong>+1%</strong> au montant total.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cette alerte ne s'affichera qu'une seule fois par session
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

