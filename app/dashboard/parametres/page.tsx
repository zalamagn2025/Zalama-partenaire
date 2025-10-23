"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PinInput } from "@/components/ui/PinInput";

export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const { session } = useEdgeAuthContext();
  const [activeTab, setActiveTab] = useState<string>("profil");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRegeneratingApiKey, setIsRegeneratingApiKey] = useState(false);
  const [apiKeyData, setApiKeyData] = useState({
    api_key: "",
    company_name: "",
    inscription_enabled: true,
  });
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
        telephone: "", // Pas de propriété téléphone dans AdminUser
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
        payment_date: "", // Pas de propriété payment_date dans Partner
        payment_day: 25,
      });
    }
  }, [session]);

  // Charger la clé API
  useEffect(() => {
    const loadApiKey = async () => {
      if (session?.access_token) {
        try {
          const response = await edgeFunctionService.getApiKey(
            session.access_token
          );
          if (response.success && response.data) {
            setApiKeyData({
              api_key: response.data.api_key || "",
              company_name: response.data.company_name || "",
              inscription_enabled: response.data.inscription_enabled || true,
            });
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la clé API:", error);
        }
      }
    };

    loadApiKey();
  }, [session]);

  const handleProfileSave = async () => {
    try {
      // TODO: Implémenter la sauvegarde des données de profil
      toast.success("Profil mis à jour avec succès");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde du profil");
    }
  };

  const handlePartnerSave = async () => {
    try {
      // TODO: Implémenter la sauvegarde des données partenaire
      toast.success("Informations de l'entreprise mises à jour");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les nouveaux codes PIN ne correspondent pas");
      return;
    }

    // Validation simple du code PIN (6 caractères minimum)
    if (passwordData.newPassword.length < 6) {
      toast.error("Le code PIN doit contenir au moins 6 caractères");
      return;
    }

    if (!session?.access_token) {
      toast.error("Session non valide");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await edgeFunctionService.changePassword(
        session.access_token,
        {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        }
      );

      if (response.success) {
        toast.success(
          "Code PIN changé avec succès. Un email de confirmation a été envoyé."
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(
          response.message || "Erreur lors du changement du code PIN"
        );
      }
    } catch (error: any) {
      console.error("Erreur lors du changement du code PIN:", error);
      toast.error(error.message || "Erreur lors du changement du code PIN");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Fonction pour copier la clé API
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

    setIsRegeneratingApiKey(true);
    try {
      const response = await edgeFunctionService.regenerateApiKey(
        session.access_token
      );

      if (response.success && response.data?.new_api_key) {
        setApiKeyData((prev) => ({
          ...prev,
          api_key: response.data.new_api_key,
        }));
        toast.success("Clé API régénérée avec succès");
      } else {
        throw new Error(response.message || "Erreur lors de la régénération");
      }
    } catch (error: any) {
      console.error("Erreur lors de la régénération de la clé API:", error);
      toast.error(
        error.message || "Erreur lors de la régénération de la clé API"
      );
    } finally {
      setIsRegeneratingApiKey(false);
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

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paramètres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez votre profil et les paramètres de votre entreprise
          </p>
        </div>
      </div>

      {/* Onglets de paramètres */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab("profil")}
          className={`px-4 py-2 transition-colors ${
            activeTab === "profil"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          } flex items-center gap-2`}
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>
        <button
          onClick={() => setActiveTab("securite")}
          className={`px-4 py-2 transition-colors ${
            activeTab === "securite"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          } flex items-center gap-2`}
        >
          <Lock className="w-4 h-4" />
          <span>Sécurité</span>
        </button>
        <button
          onClick={() => setActiveTab("apparence")}
          className={`px-4 py-2 transition-colors ${
            activeTab === "apparence"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          } flex items-center gap-2`}
        >
          <Palette className="w-4 h-4" />
          <span>Apparence</span>
        </button>
      </div>

      {/* Contenu des paramètres */}
      {activeTab === "profil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profil personnel */}
          <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mon Profil
              </h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:text-gray-300 transition-colors hover:bg-[var(--zalama-blue-accent)] bg-[var(--zalama-blue)] border border-[var(--zalama-border)] border-opacity-2  rounded-lg text-white py-2"
              >
                <Edit3 className="w-4 h-4" />
                {isEditingProfile ? "Annuler" : "Modifier"}
              </button>
            </div>

            {/* Photo de profil */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {session?.admin?.display_name?.charAt(0) || "U"}
                </div>
                {isEditingProfile && (
                  <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {session?.admin?.display_name || "Utilisateur"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {session?.admin?.role || "Rôle non défini"} •{" "}
                  {session?.partner?.company_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={profileData.nom}
                  onChange={(e) =>
                    setProfileData({ ...profileData, nom: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-[var(--zalama-card)] text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom d'affichage
                </label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      display_name: e.target.value,
                    })
                  }
                  disabled={!isEditingProfile}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-[var(--zalama-card)] text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    disabled={!isEditingProfile}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-[var(--zalama-card)] text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.telephone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        telephone: e.target.value,
                      })
                    }
                    disabled={!isEditingProfile}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-[var(--zalama-card)] text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Poste
                </label>
                <input
                  type="text"
                  value={profileData.poste}
                  onChange={(e) =>
                    setProfileData({ ...profileData, poste: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-[var(--zalama-card)] text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                />
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleProfileSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Informations de l'entreprise */}
          <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informations de l'entreprise
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'entreprise
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={partnerData.company_name}
                    onChange={(e) =>
                      setPartnerData({
                        ...partnerData,
                        company_name: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secteur d'activité
                </label>
                <select
                  value={partnerData.activity_domain}
                  onChange={(e) =>
                    setPartnerData({
                      ...partnerData,
                      activity_domain: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un secteur</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Finance">Finance</option>
                  <option value="Santé">Santé</option>
                  <option value="Éducation">Éducation</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Construction">Construction</option>
                  <option value="Transport">Transport</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email de l'entreprise
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={partnerData.email}
                    onChange={(e) =>
                      setPartnerData({ ...partnerData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white  text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone de l'entreprise
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={partnerData.phone}
                    onChange={(e) =>
                      setPartnerData({ ...partnerData, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={partnerData.headquarters_address}
                    onChange={(e) =>
                      setPartnerData({
                        ...partnerData,
                        headquarters_address: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePartnerSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "securite" && (
        <div className="w-full">
          <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Sécurité du compte
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Colonne gauche - Changement de mot de passe */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    Changer le code PIN
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Code PIN actuel
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          {showCurrentPassword ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Masquer
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Afficher
                            </>
                          )}
                        </button>
                      </div>
                      <PinInput
                        value={passwordData.currentPassword}
                        onChange={(value) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: value,
                          })
                        }
                        masked={!showCurrentPassword}
                        className="justify-start"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nouveau code PIN
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          {showNewPassword ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Masquer
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Afficher
                            </>
                          )}
                        </button>
                      </div>
                      <PinInput
                        value={passwordData.newPassword}
                        onChange={(value) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: value,
                          })
                        }
                        masked={!showNewPassword}
                        className="justify-start"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirmer le nouveau code PIN
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          {showConfirmPassword ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Masquer
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Afficher
                            </>
                          )}
                        </button>
                      </div>
                      <PinInput
                        value={passwordData.confirmPassword}
                        onChange={(value) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: value,
                          })
                        }
                        masked={!showConfirmPassword}
                        className="justify-start"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handlePasswordChange}
                        disabled={
                          isChangingPassword ||
                          !passwordData.currentPassword ||
                          !passwordData.newPassword ||
                          !passwordData.confirmPassword
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--zalama-green)] text-white hover:bg-[var(--zalama-green-accent)] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors rounded-lg"
                      >
                        {isChangingPassword ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isChangingPassword
                          ? "Changement..."
                          : "Changer le code PIN"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conseils de sécurité */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Conseils de sécurité
                  </h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• Utilisez un code PIN d'au moins 6 caractères</li>
                    <li>• Évitez les codes PIN simples (123456, etc.)</li>
                    <li>• Ne partagez jamais vos identifiants</li>
                    <li>• Changez votre code PIN régulièrement</li>
                  </ul>
                </div>
              </div>

              {/* Colonne droite - Clé API et Informations */}
              <div className="space-y-6">
                {/* Gestion de la clé API */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-600" />
                    Clé API
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Votre clé API
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKeyData.api_key}
                          readOnly
                          placeholder="Clé API non disponible"
                          className="w-full pl-10 pr-12 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Cette clé permet à vos employés de s'inscrire via l'API
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCopyApiKey}
                        disabled={!apiKeyData.api_key}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg"
                      >
                        <Copy className="w-4 h-4" />
                        Copier la clé
                      </button>
                      <button
                        onClick={handleRegenerateApiKey}
                        disabled={isRegeneratingApiKey}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg"
                      >
                        {isRegeneratingApiKey ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        {isRegeneratingApiKey
                          ? "Régénération..."
                          : "Régénérer la clé"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Informations de sécurité */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Informations de sécurité
                  </h3>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Lock className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-medium">Dernière connexion:</span>
                        <br />
                        <span>
                          {session?.admin?.last_login
                            ? formatDate(session.admin.last_login)
                            : "Non disponible"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <User className="w-4 h-4 text-green-500" />
                      <div>
                        <span className="font-medium">Rôle:</span>
                        <br />
                        <span>{session?.admin?.role || "Non défini"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <div>
                        <span className="font-medium">Compte créé:</span>
                        <br />
                        <span>
                          {session?.admin?.created_at
                            ? formatDate(session.admin.created_at)
                            : "Non disponible"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "apparence" && (
        <div className="max-w-2xl">
          <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Préférences d'apparence
            </h2>

            <div className="space-y-6">
              {/* Thème */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Mode d'affichage
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      // 🚫 TEMPORAIRE : Désactiver le thème blanc
                      console.log('🚫 Thème blanc temporairement désactivé');
                    }}
                    disabled
                    className="p-4 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Sun className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Clair
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          🚫 Temporairement désactivé
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // 🚫 TEMPORAIRE : Désactiver le toggle
                      console.log('🚫 Toggle de thème temporairement désactivé');
                    }}
                    disabled
                    className="p-4 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <Moon className="w-5 h-5 text-gray-100" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Sombre
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ✅ Actif (seul mode disponible)
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Informations sur le thème actuel */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Palette className="w-5 h-5" />
                  <span className="font-medium">
                    Thème actuel: {theme === "light" ? "Clair" : "Sombre"}
                  </span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Votre choix est automatiquement sauvegardé et synchronisé sur
                  tous vos appareils.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
