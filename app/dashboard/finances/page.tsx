"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Euro, TrendingUp, TrendingDown, Filter, Download, Printer, Users, Calendar, CreditCard, DollarSign, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import { dashboardService, PartnerDataService } from '@/lib/services';
import { financialServiceFixed } from '@/lib/services_fixed';
import type { FinancialTransaction, Employee, FinancialTransactionWithEmployee } from '@/lib/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '@/lib/supabase';

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number) => `${value.toLocaleString()} GNF`;

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Interface pour les statistiques financières
interface FinancialStats {
  totalDebloque: number;
  totalRecupere: number;
  totalRevenus: number;
  totalRemboursements: number;
  totalCommissions: number;
  balance: number;
  pendingTransactions: number;
  totalTransactions: number;
  montantMoyen: number;
  evolutionMensuelle: any[];
  repartitionParType: any[];
  repartitionParStatut: any[];
}

// Interface pour les transactions avec employé
interface TransactionWithEmployee {
  id: string;
  demande_avance_id: string | null;
  employe_id: string | null;
  entreprise_id: string;
  montant: number;
  numero_transaction: string;
  methode_paiement: string;
  numero_compte: string | null;
  numero_reception: string | null;
  date_transaction: string;
  recu_url: string | null;
  date_creation: string;
  statut: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  message_callback: string | null;
  employees?: {
    id: string;
    prenom: string;
    nom: string;
    poste: string;
  } | null;
}

export default function FinancesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  
  // États pour les données financières
  const [transactions, setTransactions] = useState<TransactionWithEmployee[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithEmployee[]>([]);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    fluxFinance: 0,
    debloqueMois: 0,
    aRembourserMois: 0,
    dateLimite: '',
    nbEmployesApprouves: 0
  });
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  // Ajoute un état pour le payment_day
  const [paymentDay, setPaymentDay] = useState<number | null>(null);

  // Charger les demandes d'avance de salaire dynamiquement
  useEffect(() => {
    if (!loading && session?.partner) {
      loadSalaryAdvanceData();
    }
  }, [loading, session?.partner]);

  // Récupère le payment_day du partenaire connecté
  useEffect(() => {
    const fetchPaymentDay = async () => {
      if (!session?.partner) return;
      const { data, error } = await supabase
        .from('partnership_requests')
        .select('payment_day')
        .eq('company_name', session.partner.company_name)
        .eq('status', 'approved')
        .single();
      if (!error && data && data.payment_day) {
        setPaymentDay(data.payment_day);
      }
    };
    fetchPaymentDay();
  }, [session?.partner]);

  // Calcul de la date limite de remboursement
  const now = new Date();
  let dateLimite = '';
  if (paymentDay) {
    let mois = now.getMonth();
    let annee = now.getFullYear();
    if (now.getDate() > paymentDay) {
      mois += 1;
      if (mois > 11) {
        mois = 0;
        annee += 1;
      }
    }
    const dateRemboursement = new Date(annee, mois, paymentDay);
    dateLimite = dateRemboursement.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const loadSalaryAdvanceData = async () => {
    setIsLoading(true);
    try {
      // 1. Récupérer toutes les transactions valides pour l'entreprise (flux financier total)
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('entreprise_id', session?.partner?.id)
        .eq('statut', 'EFFECTUEE');
      
      if (transactionsError) throw transactionsError;

      console.log(allTransactions);

      // 2. Récupérer les demandes d'avance validées pour ce mois-ci
      const { data: salaryRequests, error: salaryError } = await supabase
        .from('salary_advance_requests')
        .select('*')
        .eq('partenaire_id', session?.partner?.id)
        .eq('statut', 'Validé');
      
      if (salaryError) throw salaryError;
      
      setSalaryRequests(salaryRequests || []);
      
      // Calculs selon votre logique
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      // Transactions effectuées ce mois-ci (pour montant débloqué et à rembourser)
      const transactionsMois = (allTransactions || []).filter((t: any) => {
        const tDate = t.created_at ? new Date(t.created_at) : null;
        return tDate && tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear;
      });

      // Demandes validées ce mois-ci (pour nombre d'employés)
      const demandesMois = (salaryRequests || []).filter((d: any) => {
        const dVal = d.date_validation ? new Date(d.date_validation) : null;
        return dVal && dVal.getMonth() === thisMonth && dVal.getFullYear() === thisYear;
      });

      // Flux financier = somme de toutes les transactions valides entre l'entreprise et Zalama
      const fluxFinance = (allTransactions || []).reduce((sum: number, t: any) => sum + Number(t.montant || 0), 0);
      
      // Montant débloqué ce mois-ci = somme des montants des transactions effectuées ce mois-ci
      const debloqueMois = transactionsMois.reduce((sum: number, t: any) => sum + Number(t.montant || 0), 0);
      
      // Montant à rembourser ce mois-ci = même montant que débloqué
      const aRembourserMois = debloqueMois;
      
      // Nombre d'employés ayant eu une demande approuvée ce mois-ci = nombre de demandes validées ce mois-ci
      const employesApprouves = demandesMois.length;
      
      setStats({
        fluxFinance,
        debloqueMois,
        aRembourserMois,
        dateLimite,
        nbEmployesApprouves: employesApprouves
      });
    } catch (e) {
      console.error('Erreur lors du chargement des données financières:', e);
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques financières dynamiques
  const calculateFinancialStats = (transactions: TransactionWithEmployee[]): FinancialStats => {
    // Calculs de base - adapter selon les types de transactions dans la table transactions
    const totalDebloque = transactions
      .filter(t => t.statut === 'EFFECTUEE')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
    
    const totalRecupere = transactions
      .filter(t => t.statut === 'EFFECTUEE')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
      
    const totalRevenus = transactions
      .filter(t => t.statut === 'EFFECTUEE')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
      
    const totalRemboursements = transactions
      .filter(t => t.statut === 'EFFECTUEE')
      .reduce((sum, t) => sum + (t.montant || 0), 0);

    const totalCommissions = transactions
      .filter(t => t.statut === 'EFFECTUEE')
      .reduce((sum, t) => sum + (t.montant || 0), 0);

    const pendingTransactions = transactions.filter(t => t.statut === 'EN_COURS').length;
    const totalTransactions = transactions.length;
    const balance = totalDebloque - totalRecupere + totalRevenus - totalRemboursements;
    const montantMoyen = totalTransactions > 0 
      ? transactions.reduce((sum, t) => sum + (t.montant || 0), 0) / totalTransactions 
      : 0;

    // Calcul de l'évolution mensuelle
    const evolutionMensuelle = calculateMonthlyEvolution(transactions);

    // Répartition par type
    const repartitionParType = calculateTypeDistribution(transactions);

    // Répartition par statut
    const repartitionParStatut = calculateStatusDistribution(transactions);

    return {
      totalDebloque,
      totalRecupere,
      totalRevenus,
      totalRemboursements,
      totalCommissions,
      balance,
      pendingTransactions,
      totalTransactions,
      montantMoyen,
      evolutionMensuelle,
      repartitionParType,
      repartitionParStatut
    };
  };

  // Calculer l'évolution mensuelle
  const calculateMonthlyEvolution = (transactions: TransactionWithEmployee[]) => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === index;
      });

      // Pour le graphique, on prend toutes les transactions effectuées du mois (comme dans les StatCards)
      const debloque = monthTransactions
        .filter(t => t.statut === 'EFFECTUEE')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      const recupere = monthTransactions
        .filter(t => t.statut === 'EFFECTUEE')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      const revenus = monthTransactions
        .filter(t => t.statut === 'EFFECTUEE')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      return {
        mois: month,
        debloque,
        //recupere,
        //revenus,
        //balance: debloque - recupere + revenus
      };
    });

    return monthlyData;
  };

  // Calculer la répartition par type
  const calculateTypeDistribution = (transactions: TransactionWithEmployee[]) => {
    const typeCounts: { [key: string]: number } = {};
    
    transactions.forEach(t => {
      let type = 'Autre';
      if (t.description?.includes('Débloqué')) type = 'Débloqué';
      else if (t.description?.includes('Récupéré')) type = 'Récupéré';
      else if (t.description?.includes('Revenu')) type = 'Revenu';
      else if (t.description?.includes('Remboursement')) type = 'Remboursement';
      else if (t.description?.includes('Commission')) type = 'Commission';
      
      typeCounts[type] = (typeCounts[type] || 0) + (t.montant || 0);
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Object.entries(typeCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  // Calculer la répartition par statut
  const calculateStatusDistribution = (transactions: TransactionWithEmployee[]) => {
    const statusCounts: { [key: string]: number } = {};
    
    transactions.forEach(t => {
      const status = t.statut || 'Inconnu';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const loadFinancialData = async () => {
    if (!session?.partner) return;
    
    setIsLoading(true);
    try {
      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);
      const transactions = await partnerService.getFinancialTransactions();
      
      setTransactions(transactions as unknown as TransactionWithEmployee[]);
      
      // Calculer les statistiques financières
      const stats = calculateFinancialStats(transactions as unknown as TransactionWithEmployee[]);
      setFinancialStats(stats);

    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setIsLoading(false);
    }
  };

  // Pour l'historique des transactions, charge les données de transactions :
  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          employees (
            id,
            prenom,
            nom,
            poste
          )
        `)
        .eq('entreprise_id', session?.partner?.id)
        .order('date_transaction', { ascending: false });
      if (error) throw error;
      
      console.log('Transactions chargées:', data);
      console.log('Nombre de transactions:', data?.length);
      
      setTransactions(data || []);
      
      // Calculer les statistiques financières
      const stats = calculateFinancialStats(data || []);
      console.log('Stats calculées:', stats);
      setFinancialStats(stats);
    } catch (e) {
      console.error('Erreur lors du chargement des transactions:', e);
      toast.error('Erreur lors du chargement des transactions');
    }
  };
  useEffect(() => {
    if (!loading && session?.partner) {
      loadTransactions();
    }
  }, [loading, session?.partner]);

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [loading, session, router]);

  // Filtrer les transactions
  useEffect(() => {
    let filtered = transactions;

    if (selectedType) {
      filtered = filtered.filter(transaction => {
        if (selectedType === 'Débloqué') return transaction.description?.includes('Débloqué');
        if (selectedType === 'Récupéré') return transaction.description?.includes('Récupéré');
        if (selectedType === 'Revenu') return transaction.description?.includes('Revenu');
        if (selectedType === 'Remboursement') return transaction.description?.includes('Remboursement');
        if (selectedType === 'Commission') return transaction.description?.includes('Commission');
        return false;
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter(transaction => {
        if (selectedStatus === 'En attente') return transaction.statut === 'EN_COURS';
        if (selectedStatus === 'Validé') return transaction.statut === 'EFFECTUEE';
        if (selectedStatus === 'Rejeté') return transaction.statut === 'ECHEC';
        if (selectedStatus === 'Annulé') return transaction.statut === 'ANNULEE';
        return false;
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, selectedType, selectedStatus]);

  // Pagination
  const transactionsPerPage = 10;
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  // Exporter les données au format CSV
  const handleExportCSV = () => {
    if (!session?.partner) return;
    
    const headers = ["ID", "Date", "Employé", "Poste", "Montant", "Type", "Description", "Statut", "Référence"];
    const csvData = [
      headers.join(","),
      ...transactions.map(transaction => [
        transaction.id,
        formatDate(transaction.date_transaction),
        transaction.employees ? `${transaction.employees.prenom} ${transaction.employees.nom}` : 'Non spécifié',
        transaction.employees?.poste || 'Non spécifié',
        transaction.montant,
        transaction.description?.split(' ')[0] || 'Transaction',
        transaction.description || '',
        transaction.statut,
        transaction.numero_transaction || ''
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
            link.setAttribute('download', `transactions_${session.partner.company_name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
  };

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si pas de partenaire, afficher un message d'erreur
  if (!session?.partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 w-full max-w-full overflow-hidden">
      {/* En-tête Finances */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Finances</h1>
                      <p className="text-sm text-gray-400">Entreprise: {session.partner.company_name}</p>
      </div>

      {/* Cartes principales finances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        
        <StatCard
          title="Flux du Montant Financé"
          value={gnfFormatter(stats.fluxFinance)}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Montant total débloqué ce mois ci"
          value={gnfFormatter(stats.debloqueMois)}
          icon={Calendar}
          color="green"
        />
        
        <StatCard
          title="Montant à rembourser ce mois ci"
          value={gnfFormatter(stats.aRembourserMois)}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Date limite de Remboursement"
          value={dateLimite}
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
            title="Nombre d'employés ayant eu une demande approuvée ce mois-ci"
            value={stats.nbEmployesApprouves}
            icon={Users}
            color="purple"
        />
      </div>

      {/* Graphiques */}
      {financialStats && (
      <div className="grid grid-cols-1 gap-4">
        {/* Évolution des montants */}
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Évolution mensuelle des montants
          </h3>
          <div className="w-full h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialStats.evolutionMensuelle}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="debloque" stroke="#3b82f6" strokeWidth={2} name="Débloqué" />
                  {/*<Line type="monotone" dataKey="recupere" stroke="#10b981" strokeWidth={2} name="Récupéré" />
                    <Line type="monotone" dataKey="revenus" stroke="#f59e0b" strokeWidth={2} name="Revenus" />
                    <Line type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2} name="Balance" />*/}
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* Graphique de répartition par statut */}
      {financialStats && financialStats.repartitionParStatut.length > 0 && (
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Répartition par statut des transactions
          </h3>
          <div className="w-full h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialStats.repartitionParStatut}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Filtre par type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de transaction
            </label>
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="w-full px-3 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les types</option>
              <option value="Débloqué">Débloqué</option>
              <option value="Récupéré">Récupéré</option>
              <option value="Revenu">Revenu</option>
              <option value="Remboursement">Remboursement</option>
              <option value="Commission">Commission</option>
            </select>
          </div>

          {/* Filtre par statut */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="w-full px-3 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="Validé">Validé</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Historique des transactions ({filteredTransactions.length} transactions)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                  Statut
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                  Référence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[var(--zalama-card)] divide-y divide-gray-200 dark:divide-gray-700">
              {currentTransactions.length > 0 ? (
                currentTransactions.map((transaction) => {
                  // Déterminer le type basé sur la description
                  let transactionType = 'Transaction';
                  if (transaction.description?.includes('Débloqué')) transactionType = 'Débloqué';
                  else if (transaction.description?.includes('Récupéré')) transactionType = 'Récupéré';
                  else if (transaction.description?.includes('Revenu')) transactionType = 'Revenu';
                  else if (transaction.description?.includes('Remboursement')) transactionType = 'Remboursement';
                  else if (transaction.description?.includes('Commission')) transactionType = 'Commission';

                  // Mapper les statuts
                  let statusDisplay = transaction.statut;
                  if (transaction.statut === 'EN_COURS') statusDisplay = 'En attente';
                  else if (transaction.statut === 'EFFECTUEE') statusDisplay = 'Validé';
                  else if (transaction.statut === 'ECHEC') statusDisplay = 'Rejeté';
                  else if (transaction.statut === 'ANNULEE') statusDisplay = 'Annulé';

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                    {formatDate(transaction.date_transaction)}
                  </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{transaction.employees ? `${transaction.employees.prenom} ${transaction.employees.nom}` : 'Non spécifié'}</span>
                    {transaction.employees?.poste && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.employees.poste}
                            </span>
                          )}
                      </div>
                  </td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hidden md:table-cell">
                        <div className="max-w-xs truncate" title={transaction.description || 'Aucune description'}>
                    {transaction.description || 'Aucune description'}
                        </div>
                  </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transactionType === 'Débloqué' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          transactionType === 'Récupéré' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          transactionType === 'Revenu' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            transactionType === 'Commission' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                          {transactionType}
                    </span>
                  </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {gnfFormatter(transaction.montant || 0)}
                  </td>
                      <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusDisplay === 'Validé' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          statusDisplay === 'En attente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                          {statusDisplay}
                    </span>
                  </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        <div className="max-w-24 truncate" title={transaction.numero_transaction || '-'}>
                          {transaction.numero_transaction || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucune transaction trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-[var(--zalama-card)] px-3 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-2 relative inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Affichage de <span className="font-medium">{indexOfFirstTransaction + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(indexOfLastTransaction, filteredTransactions.length)}</span> sur{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-3 py-1 border text-xs font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
