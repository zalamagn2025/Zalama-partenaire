import React from 'react';
//import { TrendingUp } from 'lucide-react';

export default function PerformanceFinanciere() {
  return (
    <div>
        <h2 className="text-[16px] font-semibold mb-4 text-[var(--zalama-blue)]">Performance financière</h2>
        <div className="flex flex-col space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col">
              <div className="text-xs md:text-sm text-[var(--zalama-text-secondary)]">Montants Financiers</div>
              <div className="text-[16px] md:text-2[16px] font-bold text-[var(--zalama-text)]">25,000,000 GNF</div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-[16px] md:text-2[16px] font-bold text-[var(--zalama-text)]">950,000 GNF</div>
              <div className="text-xs md:text-sm text-[var(--zalama-text-secondary)]">Montant Debloqué</div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-[16px] md:text-2[16px] font-bold text-[var(--zalama-text)]">75,000 GNF</div>
              <div className="text-xs md:text-sm text-[var(--zalama-text-secondary)]">Montant Recuperé</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col">
              {/* Espace vide pour l'alignement */}
            </div>
            <div className="flex flex-col">
              <div className="text-[16px] md:text-2[16px] font-bold text-[var(--zalama-text)]">50,000 GNF</div>
              <div className="text-xs md:text-sm text-[var(--zalama-text-secondary)]">Revenus Generés</div>
            </div>
            <div className="flex flex-col">
              <div className="text-[16px] md:text-2[16px] font-bold text-[var(--zalama-text)]">90%</div>
              <div className="text-xs md:text-sm text-[var(--zalama-text-secondary)]">Taux Remboursement</div>
            </div>
          </div>
        </div>
      </div>
  );
}
