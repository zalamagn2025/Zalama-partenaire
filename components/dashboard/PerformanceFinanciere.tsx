import React from 'react';
import { CreditCard, TrendingUp, Calendar, Clock, DollarSign } from 'lucide-react';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, className = '', showPercentage = false }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Couleurs dynamiques basées sur le pourcentage
  let progressColor = 'bg-green-500';
  if (percentage < 30) {
    progressColor = 'bg-green-500';
  } else if (percentage < 60) {
    progressColor = 'bg-orange-500';
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ease-in-out ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
          {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

interface FinancialCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: 'green' | 'blue' | 'orange' | 'purple' | 'red';
  subtitle?: string;
}

const FinancialCard: React.FC<FinancialCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      accent: 'border-green-200 dark:border-green-800'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      accent: 'border-blue-200 dark:border-blue-800'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      accent: 'border-orange-200 dark:border-orange-800'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      accent: 'border-purple-200 dark:border-purple-800'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      accent: 'border-red-200 dark:border-red-800'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border ${colors.accent} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface PerformanceFinanciereProps {
  className?: string;
  totalTransactions: string;
  totalRecupere?: string;
  totalRevenus?: string;
  balance?: string;
  dateLimite: string;
}

const PerformanceFinanciere: React.FC<PerformanceFinanciereProps> = ({ 
  className = '', 
  totalTransactions, 
  totalRecupere = "0 GNF",
  totalRevenus = "0 GNF",
  balance = "0 GNF",
  dateLimite 
}) => {
  // Extraire le jour de paiement de la date d'adhésion
  const jourPaiement = new Date(dateLimite).getDate();
  
  // Calculer les dates de paiement (précédente et prochaine)
  const calculatePaymentDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Date de paiement du mois courant
    const paiementMoisCourant = new Date(currentYear, currentMonth, jourPaiement);
    
    let dernierPaiement: Date;
    let prochainPaiement: Date;
    
    if (today >= paiementMoisCourant) {
      // Si on a dépassé ou on est le jour de paiement du mois courant
      dernierPaiement = paiementMoisCourant;
      prochainPaiement = new Date(currentYear, currentMonth + 1, jourPaiement);
    } else {
      // Si on n'a pas encore atteint le jour de paiement du mois courant
      dernierPaiement = new Date(currentYear, currentMonth - 1, jourPaiement);
      prochainPaiement = paiementMoisCourant;
    }
    
    return { dernierPaiement, prochainPaiement };
  };
  
  const { dernierPaiement, prochainPaiement } = calculatePaymentDates();
  const today = new Date();
  
  // Calculer les jours
  const joursEcoules = Math.floor((today.getTime() - dernierPaiement.getTime()) / (1000 * 60 * 60 * 24));
  const joursRestants = Math.floor((prochainPaiement.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Nombre total de jours dans le cycle (entre les deux paiements)
  const totalJoursCycle = Math.floor((prochainPaiement.getTime() - dernierPaiement.getTime()) / (1000 * 60 * 60 * 24));
  
  // Données financières
  const financialData = {
    montantDebloque: totalTransactions,
    montantARembourser: totalTransactions,
    tauxRemboursement: 80,
    dateLimite: dateLimite,
    joursRestants: joursRestants,
    totalJours: totalJoursCycle,
    joursEcoules: joursEcoules,
    prochainPaiement: prochainPaiement,
    dernierPaiement: dernierPaiement,
    jourPaiement: jourPaiement
  };

  // Fonction pour formatter les montants en FCFA
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}`;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour générer le message adaptatif
  const getPaymentMessage = () => {
    if (joursRestants < 0) {
      // Date de paiement dépassée
      const joursRetard = Math.abs(joursRestants);
      return {
        type: 'danger',
        message: `🚨 Retard de paiement : Vous avez ${joursRetard} jour(s) de retard pour votre paiement mensuel !`
      };
    } else if (joursRestants === 0) {
      // C'est le jour J
      return {
        type: 'warning',
        message: `🎯 Aujourd'hui est le jour de paiement (${jourPaiement} du mois) !`
      };
    } else if (joursRestants <= 7) {
      // Moins de 7 jours restants
      return {
        type: 'caution',
        message: `⏰ Attention : Il ne reste que ${joursRestants} jour(s) avant votre prochain paiement (${formatDate(prochainPaiement)}) !`
      };
    } else {
      // Situation normale
      return {
        type: 'normal',
        message: `✅ Prochain paiement prévu le ${formatDate(prochainPaiement)} (dans ${joursRestants} jours)`
      };
    }
  };

  const paymentMessage = getPaymentMessage();

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Performance Financière
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Aperçu de vos indicateurs financiers clés
        </p>
      </div>

      {/* Grille des cartes financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FinancialCard
          title="Montant Total Débloqué"
          value={totalTransactions}
          icon={CreditCard}
          color="green"
          subtitle="Capital disponible"
        />
        
        <FinancialCard
          title="Montant Total Récupéré"
          value={totalRecupere}
          icon={DollarSign}
          color="blue"
          subtitle="Montants récupérés"
        />
        
        <FinancialCard
          title="Total Revenus"
          value={totalRevenus}
          icon={TrendingUp}
          color="orange"
          subtitle="Revenus générés"
        />
        
        <FinancialCard
          title="Balance Actuelle"
          value={balance}
          icon={Calendar}
          color={balance.includes('-') ? "red" : "purple"}
          subtitle="Solde disponible"
        />
            </div>
            
      {/* Section Cycle de Paiement avec Barre de Progression */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cycle de Paiement Mensuel
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progression vers le prochain paiement
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.abs(financialData.joursRestants)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {financialData.joursRestants >= 0 ? 'jours restants' : 'jours de retard'}
            </p>
            </div>
          </div>
          
        {/* Informations sur le cycle */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-gray-600 dark:text-gray-400">Dernier paiement</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(financialData.dernierPaiement)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-gray-600 dark:text-gray-400">Prochain paiement</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(financialData.prochainPaiement)}</p>
            </div>
            </div>

        {/* Barre de progression */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Jours écoulés: {financialData.joursEcoules}</span>
            <span>Cycle: {financialData.totalJours} jours</span>
            </div>
          <ProgressBar 
            value={financialData.joursEcoules} 
            max={financialData.totalJours}
            showPercentage={true}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Dernier paiement</span>
            <span className="font-medium">
              {Math.round((financialData.joursEcoules / financialData.totalJours) * 100)}% du cycle écoulé
            </span>
            <span>Prochain paiement</span>
          </div>
        </div>

        {/* Message adaptatif selon la situation */}
        {paymentMessage.type === 'danger' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              {paymentMessage.message}
            </p>
          </div>
        )}
        
        {paymentMessage.type === 'warning' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              {paymentMessage.message}
            </p>
          </div>
        )}
        
        {paymentMessage.type === 'caution' && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
              {paymentMessage.message}
            </p>
          </div>
        )}
        
        {paymentMessage.type === 'normal' && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              {paymentMessage.message}
            </p>
          </div>
        )}
        </div>
      </div>
  );
};

export default PerformanceFinanciere;
