"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePartnerApiKey, useRegeneratePartnerApiKey } from "@/hooks/usePartnerAuth";
import {
  Building,
  Calendar,
  Camera,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Moon,
  Palette,
  Phone,
  Save,
  Sun,
  User,
  Key,
  RefreshCw,
  Copy,
  Shield,
  Settings,
  Bell,
  Globe,
  Database,
  Users,
  CreditCard,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ArrowRight,
  Zap,
  Activity,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PinInput } from "@/components/ui/PinInput";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const { session } = useEdgeAuthContext();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Utiliser les hooks pour récupérer et régénérer la clé API
  const { data: apiKeyResponse, isLoading: isLoadingApiKey, refetch: refetchApiKey } = usePartnerApiKey();
  const regenerateApiKeyMutation = useRegeneratePartnerApiKey();
  
  const apiKeyData = {
    api_key: apiKeyResponse?.api_key || "",
    company_name: session?.partner?.companyName || "",
    inscription_enabled: true,
  };
  const isRegeneratingApiKey = regenerateApiKeyMutation.isPending;
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    nom: "",
    email: "",
    telephone: "",
    poste: "",
    display_name: "",
  });
  const [partnerData, setPartnerData] = useState({
    company_name: "",
    activity_domain: "",
    headquarters_address: "",
    phone: "",
    email: "",
    legal_status: "",
    payment_date: "",
    payment_day: 25,
  });

  // Charger les données de session au montage
  useEffect(() => {
    if (session?.admin) {
      setProfileData({
        nom: session.admin.display_name || "",
        email: session.admin.email || "",
        telephone: "",
        poste: session.admin.role || "",
        display_name: session.admin.display_name || "",
      });
    }
    if (session?.partner) {
      setPartnerData({
        company_name: session.partner.company_name || "",
        activity_domain: session.partner.activity_domain || "",
        headquarters_address: session.partner.address || "",
        phone: session.partner.phone || "",
        email: session.partner.email || "",
        legal_status: session.partner.legal_status || "",
        payment_date: "",
        payment_day: 25,
      });
    }
  }, [session]);

  // La clé API est chargée automatiquement via le hook usePartnerApiKey

  const handleSaveProfile = async () => {
    setIsEditingProfile(false);
    toast.success("Profil mis à jour avec succès");
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulation d'un appel API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Mot de passe modifié avec succès");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Erreur lors de la modification du mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!apiKeyData.api_key) {
      toast.error("Aucune clé API à copier");
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKeyData.api_key);
      toast.success("Clé API copiée dans le presse-papiers");
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie de la clé API");
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!session?.access_token) {
      toast.error("Session non valide");
      return;
    }

    try {
      const response = await regenerateApiKeyMutation.mutateAsync();

      if (response.success && response.api_key) {
        toast.success("Clé API régénérée avec succès");
        await refetchApiKey(); // Recharger la clé API
      } else {
        throw new Error(response.message || "Erreur lors de la régénération");
      }
    } catch (error: any) {
      console.error("Erreur lors de la régénération de la clé API:", error);
      toast.error(
        error.message || "Erreur lors de la régénération de la clé API"
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Composant de carte de paramètre
  const SettingCard = ({ 
    title, 
    description, 
    icon: Icon, 
    children, 
    className = "",
    badge = null 
  }: {
    title: string;
    description: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
    badge?: React.ReactNode | null;
  }) => (
    <div className={`bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              {badge}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );

  // Composant de statistique rapide
  const QuickStat = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "blue",
    trend = null 
  }: {
    title: string;
    value: string;
    icon: any;
    color?: string;
    trend?: string | null;
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
      purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    };

    return (
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  };

  // Onglets modernes
  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "profil", label: "Profil", icon: User },
    { id: "securite", label: "Sécurité", icon: Shield },
    { id: "entreprise", label: "Entreprise", icon: Building },
    { id: "apparence", label: "Apparence", icon: Palette },
    { id: "integrations", label: "Intégrations", icon: Zap, disabled: true },
  ];

  // Vérifier que la session existe
  if (!session) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Onglets modernes */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-2 backdrop-blur-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : tab.disabled
                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.disabled && (
                  <Badge variant="warning" className="text-xs ml-1">
                    Bientôt
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* Cartes principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              title="Profil utilisateur"
              description="Informations personnelles et préférences"
              icon={User}
              badge={<Badge variant="info" className="text-xs">Mis à jour</Badge>}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {profileData.display_name || "Utilisateur"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profileData.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("profil")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier le profil
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </SettingCard>

            <SettingCard
              title="Sécurité"
              description="Gestion des mots de passe et clés API"
              icon={Shield}
              badge={<Badge variant="success" className="text-xs">Sécurisé</Badge>}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Dernière modification du mot de passe
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Il y a 30 jours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Clé API
                  </span>
                  <Badge variant="success" className="text-xs">
                    Active
                  </Badge>
                </div>
                <button
                  onClick={() => setActiveTab("securite")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Gérer la sécurité
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </SettingCard>
          </div>

          {/* Actions rapides - Désactivé */}
          <SettingCard
            title="Actions rapides"
            description="Accès rapide aux fonctionnalités principales"
            icon={Zap}
            badge={<Badge variant="warning" className="text-xs">Bientôt</Badge>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
              <button disabled className="flex items-center gap-3 p-4 bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg cursor-not-allowed">
                <Download className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-400 dark:text-gray-600">
                    Exporter les données
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Télécharger un rapport
                  </p>
                </div>
              </button>
              <button disabled className="flex items-center gap-3 p-4 bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg cursor-not-allowed">
                <Bell className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-400 dark:text-gray-600">
                    Notifications
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Configurer les alertes
                  </p>
                </div>
              </button>
              <button disabled className="flex items-center gap-3 p-4 bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg cursor-not-allowed">
                <Database className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-400 dark:text-gray-600">
                    Sauvegarde
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Créer une sauvegarde
                  </p>
                </div>
              </button>
            </div>
          </SettingCard>
        </div>
      )}

      {/* Profil */}
      {activeTab === "profil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingCard
            title="Informations personnelles"
            description="Gérez vos informations de profil"
            icon={User}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, display_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Poste
                </label>
                <input
                  type="text"
                  value={profileData.poste}
                  onChange={(e) =>
                    setProfileData({ ...profileData, poste: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Sauvegarder les modifications
              </button>
            </div>
          </SettingCard>

          <SettingCard
            title="Photo de profil"
            description="Personnalisez votre photo de profil"
            icon={Camera}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Changer la photo
                  </button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    JPG, PNG jusqu'à 2MB
                  </p>
                </div>
              </div>
            </div>
          </SettingCard>
        </div>
      )}

      {/* Sécurité */}
      {activeTab === "securite" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingCard
            title="Mot de passe"
            description="Modifiez votre mot de passe pour sécuriser votre compte"
            icon={Lock}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isChangingPassword ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {isChangingPassword ? "Modification en cours..." : "Modifier le mot de passe"}
              </button>
            </div>
          </SettingCard>

          <SettingCard
            title="Clé API"
            description="Gérez votre clé API pour les intégrations"
            icon={Key}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clé API actuelle
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyData.api_key}
                    readOnly
                    className="flex-1 px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 border border-[var(--zalama-border)] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateApiKey}
                  disabled={isRegeneratingApiKey}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRegeneratingApiKey ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isRegeneratingApiKey ? "Régénération..." : "Régénérer la clé"}
                </button>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Attention
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      La régénération de votre clé API invalidera toutes les intégrations existantes. 
                      Assurez-vous de tenir au courant les salariés en cas de changement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingCard>
        </div>
      )}

      {/* Entreprise */}
      {activeTab === "entreprise" && (
        <div className="space-y-6">
          <SettingCard
            title="Informations de l'entreprise"
            description="Gérez les informations de votre entreprise"
            icon={Building}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={partnerData.company_name}
                  onChange={(e) =>
                    setPartnerData({ ...partnerData, company_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domaine d'activité
                </label>
                <input
                  type="text"
                  value={partnerData.activity_domain}
                  onChange={(e) =>
                    setPartnerData({ ...partnerData, activity_domain: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse du siège
                </label>
                <textarea
                  value={partnerData.headquarters_address}
                  onChange={(e) =>
                    setPartnerData({ ...partnerData, headquarters_address: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={partnerData.phone}
                    onChange={(e) =>
                      setPartnerData({ ...partnerData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={partnerData.email}
                    onChange={(e) =>
                      setPartnerData({ ...partnerData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Save className="w-4 h-4" />
                Sauvegarder les modifications
              </button>
            </div>
          </SettingCard>
        </div>
      )}

      {/* Apparence */}
      {activeTab === "apparence" && (
        <div className="space-y-6">
          <SettingCard
            title="Thème"
            description="Personnalisez l'apparence de votre interface"
            icon={Palette}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Mode sombre
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Basculez entre le mode clair et sombre
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === "dark" ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === "dark" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Thème {theme === "dark" ? "sombre" : "clair"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {theme === "dark" 
                      ? "Interface optimisée pour les environnements sombres"
                      : "Interface claire et lumineuse"
                    }
                  </p>
                </div>
              </div>
            </div>
          </SettingCard>
        </div>
      )}

      {/* Intégrations */}
      {activeTab === "integrations" && (
        <div className="space-y-6">
          <SettingCard
            title="Intégrations disponibles"
            description="Connectez ZaLaMa avec vos outils préférés"
            icon={Zap}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Email
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notifications par email
                    </p>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Connecté
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-4 bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Notifications push
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alertes en temps réel
                    </p>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Actif
                  </Badge>
                </div>
              </div>
            </div>
          </SettingCard>
        </div>
      )}
    </div>
  );
}