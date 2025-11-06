"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Banknote, 
  TrendingUp, 
  Calendar, 
  Users, 
  Filter, 
  RefreshCw, 
  Loader2,
  Eye,
  Download,
  User,
  Mail,
  Phone,
  DollarSign,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  Hash,
  MapPin,
  Search,
  Plus,
  ChevronDown,
  X,
  ArrowRight,
  Calendar as CalendarIcon,
  UserCheck,
  Building,
  AlertCircle,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Save
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Types pour les données
type Payment = {
  id: string;
  employe_id: string;
  salaire_net: number;
  salaire_disponible: number;
  avances_deduites: number;
  montant_total_remboursement: number;
  frais_intervention?: number;
  montant?: number; // Alias pour compatibilité
  statut: string;
  date_paiement: string;
  periode_debut: string;
  periode_fin: string;
  mois_paye?: string; // Calculé à partir de periode_debut
  reference_paiement: string;
  methode_paiement?: string;
  intervention_zalama?: boolean;
  created_at: string;
  employe?: {
    id: string;
    nom: string;
    prenom: string;
    poste: string;
    email: string;
    telephone: string;
    photo_url?: string;
    salaire_net?: number;
  };
};

type Employee = {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  email: string;
  telephone: string;
  photo_url?: string;
  salaire_net?: number;
  salaire_mensuel?: number; // Alias pour compatibilité
};

export default function PaymentSalaryPage() {
  const { session } = useEdgeAuthContext();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<any>(null); // ✅ Nouvelles stats depuis l'API
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);

  // États pour la page de paiement
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [paymentMonth, setPaymentMonth] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);

  // Charger les données
  useEffect(() => {
    if (session?.access_token) {
      loadAllData();
    }
  }, [session?.access_token]);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([loadPayments(), loadEmployees(), loadStatistics()]);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await fetch("/api/proxy/payments?action=list&page=1&limit=100", {
          headers: {
          Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des paiements");
      }

      const data = await response.json();
      
      if (data.success) {
        // Mapper les données pour ajouter mois_paye et montant
        // ✅ Utiliser salaire_disponible_total (inclut les ajustements)
        const mappedPayments = (Array.isArray(data.data) ? data.data : []).map((payment: any) => ({
          ...payment,
          mois_paye: payment.periode_debut ? payment.periode_debut.substring(0, 7) : null,
          montant: payment.salaire_disponible_total || payment.salaire_disponible || 0
        }));
        
        setPayments(mappedPayments);
      } else {
        throw new Error(data.message || "Erreur lors du chargement des paiements");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paiements:", error);
      toast.error("Erreur lors du chargement des paiements");
      setPayments([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch("/api/proxy/payments?action=statistics", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des statistiques");
      }

      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      } else {
        throw new Error(data.message || "Erreur lors du chargement des statistiques");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement des statistiques");
      setStatistics(null);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/proxy/employees", {
          headers: {
          Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des employés");
      }

      const data = await response.json();
      if (data.success) {
        // Mapper les données pour ajouter salaire_mensuel à partir de salaire_net
        const employeesData = data.data?.employees || data.data || [];
        const mappedEmployees = (Array.isArray(employeesData) ? employeesData : []).map((emp: any) => ({
          ...emp,
          salaire_mensuel: emp.salaire_net || 0
        }));
        
        setEmployees(mappedEmployees);
        console.log('✅ Employés chargés:', mappedEmployees.length, 'employés');
      } else {
        throw new Error(data.message || "Erreur lors du chargement des employés");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
      toast.error("Erreur lors du chargement des employés");
      setEmployees([]);
    }
  };

  // Filtrage des paiements
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.employe?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.employe?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.employe?.poste?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.mois_paye?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || payment.statut === selectedStatus;
    const matchesMonth = selectedMonth === "all" || payment.mois_paye === selectedMonth;
    const matchesEmployee = selectedEmployee === "all" || payment.employe_id === selectedEmployee;

    return matchesSearch && matchesStatus && matchesMonth && matchesEmployee;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  // ✅ NOUVELLES STATISTIQUES depuis l'API (pas de calculs locaux)
  const totalPayments = statistics?.total_paiements || 0;
  const totalSalaires = statistics?.montant_total_salaires || 0;
  const totalAvancesDeduites = statistics?.montant_total_avances_deduites || 0;
  const totalRemboursements = statistics?.montant_total_remboursements || 0;
  const completedPayments = statistics?.paiements_effectues || 0;
  const pendingPayments = statistics?.paiements_en_attente || 0;

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAYE":
      case "completed":
        return "success";
      case "EN_ATTENTE":
      case "pending":
        return "warning";
      case "EN_RETARD":
        return "error";
      case "ANNULE":
        return "error";
      case "REMBOURSE":
        return "info";
      case "ECHOUE":
      case "failed":
        return "error";
      default:
        return "info";
    }
  };

  // Fonction pour obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAYE":
        return "Payé";
      case "EN_ATTENTE":
        return "En attente";
      case "EN_RETARD":
        return "En retard";
      case "ANNULE":
        return "Annulé";
      case "REMBOURSE":
        return "Remboursé";
      case "ECHOUE":
        return "Échoué";
      case "completed":
        return "Effectué";
      case "pending":
        return "En attente";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  // Fonction pour formater le montant
  const formatAmount = (amount: number | undefined | null) => {
    if (!amount || isNaN(amount)) return '0';
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  // Fonction pour formater le numéro de téléphone
  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return "Non renseigné";
    // Supprimer tous les espaces et le préfixe +224 s'il existe déjà
    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+?224/, '');
    return `+224 ${cleanPhone}`;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fonction pour obtenir le nom du mois
  const getMonthName = (monthString: string) => {
    if (!monthString) return "N/A";
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
  };

  // Mois disponibles pour le filtre
  const availableMonths = Array.from(new Set(payments.map(p => p.mois_paye).filter((m): m is string => Boolean(m)))).sort();

  // Fonctions pour la gestion des employés sélectionnés
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // Calcul du montant total
  const selectedEmployeesData = employees.filter(emp => selectedEmployees.includes(emp.id));
  const totalAmountSelected = selectedEmployeesData.reduce((sum, emp) => sum + (emp.salaire_mensuel || 0), 0);

  // Navigation entre étapes
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"></div>

        {/* Skeleton pour le tableau des paiements */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Page d'effectuation de paiement
  if (showPaymentPage) {
  return (
      <div className="p-6 space-y-6">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPaymentPage(false)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Effectuer un paiement de salaire
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
                Sélectionnez les employés et configurez le paiement mensuel
          </p>
        </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="text-sm">
              Étape {currentStep} sur 3
            </Badge>
          </div>
      </div>

        {/* Étapes de progression */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                1
        </div>
              <span className={`text-sm font-medium ${
                currentStep >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}>
                Sélectionner
              </span>
            </div>
            <div className={`w-16 h-0.5 ${
              currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}></div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}>
                Configurer
              </span>
            </div>
            <div className={`w-16 h-0.5 ${
              currentStep >= 3 ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}></div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                3
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 3 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}>
                Confirmer
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Section principale */}
          <div className="xl:col-span-2 space-y-6">
            {/* Étape 1: Sélection des employés */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Recherche et filtres */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher un employé..."
                        className="w-full pl-10 pr-4 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
                    <button 
                      onClick={selectAllEmployees}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={clearSelection}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Sélectionnés:</span>
                    <Badge variant="info" className="text-xs">{selectedEmployees.length} employé(s)</Badge>
                  </div>
                </div>

                {/* Liste des employés */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow-sm backdrop-blur-sm">
                  <div className="p-4 border-b border-[var(--zalama-border)]/30">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Employés disponibles ({employees.length})
                    </h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {employees.map((employee) => (
                      <div 
                        key={employee.id} 
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-[var(--zalama-border)]/20 last:border-b-0 cursor-pointer ${
                          selectedEmployees.includes(employee.id) ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                        }`}
                        onClick={() => toggleEmployeeSelection(employee.id)}
                      >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {employee.photo_url ? (
                            <Image
                              src={employee.photo_url}
                              alt={`${employee.prenom} ${employee.nom}`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                              {employee.prenom?.charAt(0)}
                              {employee.nom?.charAt(0)}
            </span>
                          )}
          </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {employee.prenom} {employee.nom}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {employee.poste}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {employee.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatAmount(employee.salaire_mensuel || 0)} GNF
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Salaire mensuel
                            </p>
                          </div>
                          <div className={`w-5 h-5 border-2 rounded cursor-pointer transition-colors ${
                            selectedEmployees.includes(employee.id) 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-orange-500'
                          }`}>
                            {selectedEmployees.includes(employee.id) && (
                              <CheckCircle2 className="w-3 h-3 text-white m-0.5" />
                            )}
                          </div>
                        </div>
              </div>
            ))}
          </div>
        </div>
              </div>
            )}

            {/* Étape 2: Configuration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Configuration du paiement
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mois de paiement
                      </label>
                      <select 
                        value={paymentMonth}
                        onChange={(e) => setPaymentMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Sélectionner le mois</option>
                        <option value="2024-01">Janvier 2024</option>
                        <option value="2024-02">Février 2024</option>
                        <option value="2024-03">Mars 2024</option>
                        <option value="2024-04">Avril 2024</option>
                        <option value="2024-05">Mai 2024</option>
                        <option value="2024-06">Juin 2024</option>
                        <option value="2024-07">Juillet 2024</option>
                        <option value="2024-08">Août 2024</option>
                        <option value="2024-09">Septembre 2024</option>
                        <option value="2024-10">Octobre 2024</option>
                        <option value="2024-11">Novembre 2024</option>
                        <option value="2024-12">Décembre 2024</option>
                      </select>
        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date de paiement
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Méthode de paiement
                      </label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Sélectionner la méthode</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="bank_transfer">Virement bancaire</option>
                        <option value="cash">Espèces</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Confirmation du paiement
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                            Paiement prêt à être effectué
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Vérifiez les informations ci-dessous avant de confirmer le paiement.
                          </p>
                        </div>
                      </div>
        </div>
        
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mois de paiement</label>
                        <p className="text-gray-900 dark:text-white">{getMonthName(paymentMonth)}</p>
          </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de paiement</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(paymentDate)}</p>
          </div>
                          <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Méthode</label>
                        <p className="text-gray-900 dark:text-white">
                          {paymentMethod === "mobile_money" ? "Mobile Money" :
                           paymentMethod === "bank_transfer" ? "Virement bancaire" :
                           paymentMethod === "cash" ? "Espèces" : "Non sélectionnée"}
                            </p>
                          </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employés sélectionnés</label>
                        <p className="text-gray-900 dark:text-white">{selectedEmployees.length} employé(s)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Résumé du paiement */}
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Résumé du paiement
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Employés sélectionnés</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedEmployees.length}</span>
              </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Montant total</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatAmount(totalAmountSelected)} GNF</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Frais de transaction</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">0 GNF</span>
                </div>
                <div className="border-t border-[var(--zalama-border)]/30 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">Total à payer</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatAmount(totalAmountSelected)} GNF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Actions rapides
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={selectAllEmployees}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Sélectionner tous les employés
                </button>
                <button 
                  onClick={clearSelection}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Désélectionner tout
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  Exporter la liste
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
              <div className="space-y-3">
                {currentStep > 1 && (
                  <button 
                    onClick={prevStep}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Étape précédente
                  </button>
                )}
                
                {currentStep < 3 && (
                  <button 
                    onClick={nextStep}
                    disabled={currentStep === 1 && selectedEmployees.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Étape suivante
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button 
                    disabled={!paymentMonth || !paymentDate || !paymentMethod}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Effectuer le paiement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page principale des paiements
  return (
    <div className="p-6">
      {/* En-tête avec titre et bouton d'action */}
      <div className="flex items-center justify-between mb-6">
              <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paiement de salaire
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gérez les paiements de salaire de vos employés
                </p>
              </div>
              <button
          onClick={() => setShowPaymentPage(true)}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          style={{ background: 'var(--zalama-orange)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--zalama-orange)'}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Effectuer un paiement</span>
              </button>
            </div>
            
      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Paiements */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="info" className="text-xs">Total</Badge>
          </div>
              <div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {totalPayments}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Total Paiements
                    </p>
                  </div>
        </div>

        {/* Montant Total Salaires */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" className="text-xs">Salaires</Badge>
                  </div>
                  <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatAmount(totalSalaires)} GNF
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Montant Total Salaires
            </p>
          </div>
        </div>

        {/* Avances Déduites */}
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge variant="warning" className="text-xs">Avances</Badge>
                  </div>
                  <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {formatAmount(totalAvancesDeduites)} GNF
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              Avances Déduites
            </p>
          </div>
        </div>

        {/* Montant Remboursements */}
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-5 border border-purple-200 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Banknote className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Rembours.</Badge>
                  </div>
                  <div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatAmount(totalRemboursements)} GNF
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Montant Remboursements
            </p>
                  </div>
                </div>
              </div>

      {/* Filtres avancés */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Filtres avancés
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 border border-orange-300 dark:border-orange-600 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                {showFilters ? "Masquer" : "Afficher"}
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("all");
                  setSelectedMonth("all");
                  setSelectedEmployee("all");
                  setSearchTerm("");
                }}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={loadAllData}
                disabled={loadingData}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {loadingData ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : null}
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {/* Barre de recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recherche
            </label>
            <div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="EN_ATTENTE">EN_ATTENTE</option>
              <option value="PAYE">PAYE</option>
              <option value="EN_RETARD">EN_RETARD</option>
              <option value="ANNULE">ANNULE</option>
              <option value="REMBOURSE">REMBOURSE</option>
            </select>
          </div>

          {/* Filtre par mois */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mois
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les mois</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par employé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employé
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les employés</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.prenom} {employee.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
        )}

        {/* Indicateur de chargement */}
        {loadingData && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Mise à jour des données...
          </div>
        )}
      </div>

      {/* Tableau des paiements */}
      {loadingData ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Chargement des paiements...
          </span>
        </div>
      ) : currentPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun paiement trouvé
                </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucun paiement ne correspond aux critères de recherche.
                            </p>
                  </div>
                        ) : (
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
                <tr>
                  <th className="w-1/5 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mois payé
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Salaire Net
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Avances déduites
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Salaire reçu
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date de paiement
                  </th>
                  <th className="w-1/12 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
                {currentPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {payment.employe?.photo_url ? (
                            <Image
                              src={payment.employe.photo_url}
                              alt={`${payment.employe.prenom} ${payment.employe.nom}`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                              {payment.employe?.prenom?.charAt(0)}
                              {payment.employe?.nom?.charAt(0)}
                    </span>
                          )}
                  </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {payment.employe?.prenom} {payment.employe?.nom}
                  </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.employe?.poste || "N/A"}
                  </div>
                  </div>
                  </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getMonthName(payment.mois_paye || '')}
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {formatAmount(payment.employe?.salaire_net || payment.salaire_net || 0)} GNF
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium text-orange-600 dark:text-orange-400">
                      {formatAmount(payment.avances_deduites || 0)} GNF
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {formatAmount(payment.montant)} GNF
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Badge variant={getStatusBadgeVariant(payment.statut)} className="text-xs">
                        {getStatusLabel(payment.statut)}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payment.date_paiement)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailModal(true);
                        }}
                        className="group relative p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          Voir
                </div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>

            {/* Pagination */}
          {filteredPayments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPayments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
              </div>
      )}

      {/* Modal de détails du paiement */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              <div>
                  <h3 className="text-xl font-bold text-white">
                    Détails du paiement
                </h3>
                  <p className="text-[var(--zalama-text-secondary)] text-sm mt-0.5">
                    Informations complètes du paiement
                  </p>
                  </div>
                  </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-[var(--zalama-text-secondary)] hover:text-white transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
                  </div>
            
            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Informations employé - prend toute la largeur */}
              <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">Employé</span>
                      </div>
                <div className="space-y-2">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {selectedPayment.employe?.prenom} {selectedPayment.employe?.nom}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Email:</span> {selectedPayment.employe?.email || "Non renseigné"}
                  </p>
                </div>
              </div>

              {/* Autres informations en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salaire Net */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Salaire Net</span>
                  </div>
                  <p className="font-medium text-orange-600 dark:text-orange-400">
                    {formatAmount(selectedPayment.employe?.salaire_net || selectedPayment.salaire_net || 0)} GNF
                    </p>
                  </div>
                {/* Mois payé */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Mois payé</span>
                </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedPayment.mois_paye ? getMonthName(selectedPayment.mois_paye) : "N/A"}
                  </p>
              </div>

                {/* Phone Card */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Téléphone</span>
                </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatPhoneNumber(selectedPayment.employe?.telephone)}
                  </p>
            </div>
            
                {/* Salaire reçu */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Salaire reçu</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatAmount(selectedPayment.montant || selectedPayment.salaire_disponible)} GNF
                    </p>
                  </div>

                {/* Avances déduites */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Avances déduites</span>
                  </div>
                  <p className="font-medium text-orange-600 dark:text-orange-400">
                    {formatAmount(selectedPayment.avances_deduites || 0)} GNF
                    </p>
                  </div>

                {/* Statut */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Statut</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(selectedPayment.statut)} className="text-xs">
                    {getStatusLabel(selectedPayment.statut)}
                  </Badge>
            </div>
            
                {/* Date de paiement */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Date de paiement</span>
                      </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedPayment.date_paiement)}
                  </p>
              </div>

                {/* ID du paiement */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                      <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">ID Paiement</span>
                </div>
                  <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                    {selectedPayment.id}
                  </p>
            </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}