import React from 'react';
import { AlertTriangle, Shield, Activity, TrendingUp } from 'lucide-react';

export default function AlertesRisques() {
  return (
    <div>
        <h2 className="text-xl font-semibold mb-4 text-[var(--zalama-blue)]">Alertes et notifications</h2>
        <div className="space-y-4">
          <div className="p-3 bg-[var(--zalama-bg-darker)] rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-[var(--zalama-warning)] mt-1" />
            <div>
              <div className="font-medium text-[var(--zalama-text)]">Retards de paiement</div>
              <div className="text-sm text-[var(--zalama-text-secondary)]">15 utilisateurs ont des retards de paiement de plus de 30 jours</div>
            </div>
          </div>
          
          <div className="p-3 bg-[var(--zalama-bg-darker)] rounded-lg flex items-start gap-3">
            <Shield className="text-[var(--zalama-blue)] mt-1" />
            <div>
              <div className="font-medium text-[var(--zalama-text)]">Vérifications d&apos;identité</div>
              <div className="text-sm text-[var(--zalama-text-secondary)]">28 vérifications d&apos;identité en attente</div>
            </div>
          </div>
          
          <div className="p-3 bg-[var(--zalama-bg-darker)] rounded-lg flex items-start gap-3">
            <Activity className="text-[var(--zalama-green)] mt-1" />
            <div>
              <div className="font-medium text-[var(--zalama-text)]">Pic d&apos;activité</div>
              <div className="text-sm text-[var(--zalama-text-secondary)]">Pic d&apos;activité détecté à 14h30 aujourd&apos;hui</div>
            </div>
          </div>
          
          <div className="p-3 bg-[var(--zalama-bg-darker)] rounded-lg flex items-start gap-3">
            <TrendingUp className="text-[var(--zalama-blue)] mt-1" />
            <div>
              <div className="font-medium text-[var(--zalama-text)]">Augmentation des transactions</div>
              <div className="text-sm text-[var(--zalama-text-secondary)]">+22% de transactions par rapport à la semaine dernière</div>
            </div>
          </div>
        </div>
      </div>
      
  );
}
