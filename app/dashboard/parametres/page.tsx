"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePartnerApiKey, useRegeneratePartnerApiKey } from "@/hooks/usePartnerAuth";
import { API_ROUTES, API_CONFIG, getApiUrl, getDefaultHeaders } from "@/config/api";
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
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { PinInput } from "@/components/ui/PinInput";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const { session: sessionRaw } = useEdgeAuthContext();
  
  // Mémoriser la session pour éviter les re-renders inutiles
  // Utiliser l'ID de session comme clé de dépendance
  const sessionId = sessionRaw?.admin?.id || sessionRaw?.partner?.id || null;
  const session = useMemo(() => sessionRaw, [sessionId]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  
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

  // Initialiser les états avec des valeurs par défaut
  // Ces états ne seront JAMAIS réinitialisés automatiquement
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
  
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Initialiser UNE SEULE FOIS quand la session devient disponible
  const initializedRef = useRef(false);
  
  // Utiliser useEffect pour éviter les mutations directes pendant le render
  useEffect(() => {
    if (session && !initializedRef.current) {
      initializedRef.current = true;
      
      if (session.admin) {
        setProfileData({
          nom: session.admin.display_name || session.admin.lastName || "",
          email: session.admin.email || "",
          telephone: session.admin.phone || "",
          poste: session.admin.role || "",
          display_name: session.admin.display_name || `${session.admin.firstName || ""} ${session.admin.lastName || ""}`.trim(),
        });
        
        if (session.admin.photoUrl) {
          setProfileImagePreview(session.admin.photoUrl);
        }
      }
      
      if (session.partner) {
        setPartnerData({
          company_name: session.partner.companyName || "",
          activity_domain: session.partner.activityDomain || "",
          headquarters_address: session.partner.headquartersAddress || "",
          phone: session.partner.phone || "",
          email: session.partner.email || "",
          legal_status: session.partner.legalStatus || "",
          payment_date: "",
          payment_day: 25,
        });
        
        if (session.partner.logoUrl) {
          setLogoPreview(session.partner.logoUrl);
        }
      }
    }
  }, [session]);

  // La clé API est chargée automatiquement via le hook usePartnerApiKey

  // Handlers stables pour éviter les re-renders
  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePartnerChange = useCallback((field: string, value: string) => {
    setPartnerData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePasswordChange = useCallback((field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveProfile = async () => {
    if (!session?.admin?.id || !session?.access_token) {
      toast.error("Session invalide");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch(getApiUrl(API_ROUTES.users.update(session.admin.id)), {
        method: 'PUT',
        headers: getDefaultHeaders(session.access_token),
        body: JSON.stringify({
          firstName: profileData.display_name?.split(' ')[0] || profileData.nom,
          lastName: profileData.display_name?.split(' ').slice(1).join(' ') || profileData.nom,
          email: profileData.email,
          phone: profileData.telephone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour' }));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      toast.success("Profil mis à jour avec succès");
      setIsEditingProfile(false);
      
      // Rafraîchir la session si nécessaire
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    // Validation : exactement 6 chiffres
    const passwordRegex = /^\d{6}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast.error("Le mot de passe doit contenir exactement 6 chiffres");
      return;
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }

    if (!session?.access_token) {
      toast.error("Session invalide");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(getApiUrl(API_ROUTES.auth.changePassword), {
        method: 'POST',
        headers: getDefaultHeaders(session.access_token),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la modification' }));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      toast.success(data.message || "Mot de passe modifié avec succès");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error('Erreur lors de la modification du mot de passe:', error);
      toast.error(error.message || "Erreur lors de la modification du mot de passe");
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
        throw new Error("Erreur lors de la régénération");
      }
    } catch (error: any) {
      console.error("Erreur lors de la régénération de la clé API:", error);
      toast.error(
        error.message || "Erreur lors de la régénération de la clé API"
      );
    }
  };

  const handleSavePartnerInfo = async () => {
    if (!session?.access_token) {
      toast.error("Session invalide");
      return;
    }

    setIsSavingPartner(true);
    try {
      const response = await fetch(getApiUrl(API_ROUTES.partnerInfo.update), {
        method: 'PUT',
        headers: getDefaultHeaders(session.access_token),
        body: JSON.stringify({
          companyName: partnerData.company_name,
          activityDomain: partnerData.activity_domain,
          headquartersAddress: partnerData.headquarters_address,
          phone: partnerData.phone,
          email: partnerData.email,
          legalStatus: partnerData.legal_status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour' }));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      toast.success(data.message || "Informations de l'entreprise mises à jour avec succès");
      
      // Rafraîchir la session si nécessaire
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des informations entreprise:', error);
      toast.error(error.message || "Erreur lors de la mise à jour des informations");
    } finally {
      setIsSavingPartner(false);
    }
  };

  // Fonction pour uploader une image
  const uploadImage = async (file: File, subfolder: string): Promise<string> => {
    if (!session?.access_token) {
      throw new Error("Session invalide");
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP');
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Fichier trop volumineux. Taille maximale: 5MB');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subfolder', subfolder);

    const response = await fetch(getApiUrl(API_ROUTES.upload.file), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de l\'upload' }));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    const data = await response.json();
    // Construire l'URL complète
    const baseUrl = API_CONFIG.baseURL.replace(/\/$/, ''); // Enlever le slash final s'il existe
    const fileUrl = data.url.startsWith('/') ? data.url : `/${data.url}`;
    return `${baseUrl}${fileUrl}`;
  };

  // Upload du logo du partenaire
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!session?.partner?.id || !session?.access_token) {
      toast.error("Session invalide");
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader l'image
      const logoUrl = await uploadImage(file, 'partners');

      // Mettre à jour le partenaire avec le nouveau logo
      const response = await fetch(getApiUrl(API_ROUTES.partnerInfo.update), {
        method: 'PUT',
        headers: getDefaultHeaders(session.access_token),
        body: JSON.stringify({
          logoUrl: logoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour' }));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      toast.success("Logo mis à jour avec succès");
      
      // Rafraîchir la session
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'upload du logo:', error);
      toast.error(error.message || "Erreur lors de l'upload du logo");
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
      // Réinitialiser l'input
      e.target.value = '';
    }
  };

  // Upload de la photo de profil
  const handleUploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!session?.admin?.id || !session?.access_token) {
      toast.error("Session invalide");
      return;
    }

    setIsUploadingProfileImage(true);
    try {
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader l'image
      const imageUrl = await uploadImage(file, 'profiles');

      // Mettre à jour l'utilisateur avec la nouvelle photo
      const response = await fetch(getApiUrl(API_ROUTES.users.update(session.admin.id)), {
        method: 'PUT',
        headers: getDefaultHeaders(session.access_token),
        body: JSON.stringify({
          photoUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour' }));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      toast.success("Photo de profil mise à jour avec succès");
      // Rafraîchir la session
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      toast.error(error.message || "Erreur lors de l'upload de la photo");
      setProfileImagePreview(null);
    } finally {
      setIsUploadingProfileImage(false);
      // Réinitialiser l'input
      e.target.value = '';
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
          <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
      blue: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
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

      {/* Onglets avec design remboursements */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700' 
                  : tab.disabled
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50 border-transparent'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-orange-300 dark:hover:border-orange-700 border-transparent'
              }`}
              style={{ height: '2rem', lineHeight: '1' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ lineHeight: '1' }} />
              <span className="flex-shrink-0" style={{ lineHeight: '1' }}>{tab.label}</span>
              {tab.disabled && (
                <Badge variant="warning" className="text-xs ml-1 flex-shrink-0">
                  Bientôt
                </Badge>
              )}
            </button>
          );
        })}
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
                  <div className="relative w-12 h-12 bg-orange-50/30 dark:bg-orange-900/40 rounded-full flex items-center justify-center overflow-hidden">
                    {session?.admin?.photoUrl ? (
                      <Image
                        src={session.admin.photoUrl}
                        alt={profileData.display_name || "Utilisateur"}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    )}
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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
                <Input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) => handleProfileChange('display_name', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Poste
                </label>
                <Input
                  type="text"
                  value={profileData.poste}
                  onChange={(e) => handleProfileChange('poste', e.target.value)}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSavingProfile ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
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
                <div className="relative w-20 h-20 bg-orange-50/30 dark:bg-orange-900/40 rounded-full flex items-center justify-center overflow-hidden">
                  {profileImagePreview || session?.admin?.photoUrl ? (
                    <Image
                      src={profileImagePreview || session?.admin?.photoUrl || ''}
                      alt="Photo de profil"
                      fill
                      className="object-cover rounded-full"
                      sizes="80px"
                    />
                  ) : (
                    <User className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                  )}
                  {isUploadingProfileImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleUploadProfileImage}
                      disabled={isUploadingProfileImage}
                      className="hidden"
                    />
                    <div className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-block disabled:opacity-50 disabled:cursor-not-allowed">
                      {isUploadingProfileImage ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Upload en cours...
                        </span>
                      ) : (
                        "Changer la photo"
                      )}
                    </div>
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    JPG, PNG, WebP jusqu'à 5MB
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
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full pr-10"
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
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    maxLength={6}
                    placeholder="6 chiffres"
                    className="w-full pr-10"
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Le mot de passe doit contenir exactement 6 chiffres
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    maxLength={6}
                    placeholder="6 chiffres"
                    className="w-full pr-10"
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
                {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
                {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && /^\d{6}$/.test(passwordData.newPassword) && (
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                    ✓ Les mots de passe correspondent
                  </p>
                )}
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
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyData.api_key}
                    readOnly
                    className="flex-1 bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 border border-[var(--zalama-border)] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
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
            title="Logo de l'entreprise"
            description="Téléchargez le logo de votre entreprise"
            icon={Building}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {logoPreview || session?.partner?.logoUrl ? (
                    <Image
                      src={logoPreview || session?.partner?.logoUrl || ''}
                      alt="Logo entreprise"
                      fill
                      className="object-contain p-2"
                      sizes="128px"
                    />
                  ) : (
                    <Building className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <RefreshCw className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleUploadLogo}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                    <div className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-block disabled:opacity-50 disabled:cursor-not-allowed">
                      {isUploadingLogo ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Upload en cours...
                        </span>
                      ) : (
                        "Changer le logo"
                      )}
                    </div>
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    JPG, PNG, WebP jusqu'à 5MB
                  </p>
                  {session?.partner?.logoUrl && !logoPreview && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Logo actuel
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SettingCard>

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
                <Input
                  type="text"
                  value={partnerData.company_name}
                  onChange={(e) => handlePartnerChange('company_name', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domaine d'activité
                </label>
                <Input
                  type="text"
                  value={partnerData.activity_domain}
                  onChange={(e) => handlePartnerChange('activity_domain', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse du siège
                </label>
                <Textarea
                  value={partnerData.headquarters_address}
                  onChange={(e) => handlePartnerChange('headquarters_address', e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone
                  </label>
                  <Input
                    type="tel"
                    value={partnerData.phone}
                    onChange={(e) => handlePartnerChange('phone', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={partnerData.email}
                    onChange={(e) => handlePartnerChange('email', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <button
                onClick={handleSavePartnerInfo}
                disabled={isSavingPartner}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingPartner ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSavingPartner ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
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
                    theme === "dark" ? "bg-orange-600" : "bg-gray-200"
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
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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