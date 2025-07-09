"use client";

import React, { useState, useEffect } from 'react';
import { User, Palette, Moon, Sun, Save, Mail, Phone, Building, Calendar, MapPin, Edit3, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profil');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    display_name: ''
  });
  const [partnerData, setPartnerData] = useState({
    nom: '',
    secteur: '',
    adresse: '',
    telephone: '',
    email: '',
    description: '',
    date_adhesion: '',
    ville: '',
    pays: ''
  });

  // Charger les données de session au montage
  useEffect(() => {
    if (session?.admin) {
      setProfileData({
        nom: session.admin.display_name || '',
        email: session.admin.email || '',
        telephone: '',  // Pas de propriété téléphone dans AdminUser
        poste: session.admin.role || '',
        display_name: session.admin.display_name || ''
      });
    }
    if (session?.partner) {
      setPartnerData({
        nom: session.partner.nom || '',
        secteur: session.partner.secteur || '',
        adresse: session.partner.adresse || '',
        telephone: session.partner.telephone || '',
        email: session.partner.email || '',
        description: session.partner.description || '',
        date_adhesion: session.partner.date_adhesion || '',
        ville: session.partner.adresse || '',
        pays: 'Guinée'
      });
    }
  }, [session]);

  const handleProfileSave = async () => {
    try {
      // TODO: Implémenter la sauvegarde des données de profil
      toast.success('Profil mis à jour avec succès');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  const handlePartnerSave = async () => {
    try {
      // TODO: Implémenter la sauvegarde des données partenaire
      toast.success('Informations de l\'entreprise mises à jour');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Mettre à jour le mot de passe avec Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Mot de passe changé avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
          onClick={() => setActiveTab('profil')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'profil' 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          } flex items-center gap-2`}
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>
        <button 
          onClick={() => setActiveTab('securite')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'securite' 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          } flex items-center gap-2`}
        >
          <Lock className="w-4 h-4" />
          <span>Sécurité</span>
        </button>
        <button 
          onClick={() => setActiveTab('apparence')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'apparence' 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          } flex items-center gap-2`}
        >
          <Palette className="w-4 h-4" />
          <span>Apparence</span>
        </button>
      </div>
      
      {/* Contenu des paramètres */}
      {activeTab === 'profil' && (
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
                {isEditingProfile ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            {/* Photo de profil */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {session?.admin?.display_name?.charAt(0) || 'U'}
                </div>
                {isEditingProfile && (
                  <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {session?.admin?.display_name || 'Utilisateur'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {session?.admin?.role || 'Rôle non défini'} • {session?.partner?.nom}
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
                  onChange={(e) => setProfileData({...profileData, nom: e.target.value})}
                  disabled={!isEditingProfile}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom d'affichage
                </label>
                <input 
                  type="text" 
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                  disabled={!isEditingProfile}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                />
              </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditingProfile}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  />
                </div>
              </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="tel" 
                    value={profileData.telephone}
                    onChange={(e) => setProfileData({...profileData, telephone: e.target.value})}
                    disabled={!isEditingProfile}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
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
                  onChange={(e) => setProfileData({...profileData, poste: e.target.value})}
                  disabled={!isEditingProfile}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
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
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={partnerData.nom}
                    onChange={(e) => setPartnerData({...partnerData, nom: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secteur d'activité
                </label>
                <select 
                  value={partnerData.secteur}
                  onChange={(e) => setPartnerData({...partnerData, secteur: e.target.value})}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    value={partnerData.email}
                    onChange={(e) => setPartnerData({...partnerData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
      </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone de l'entreprise
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="tel" 
                    value={partnerData.telephone}
                    onChange={(e) => setPartnerData({...partnerData, telephone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={partnerData.adresse}
                    onChange={(e) => setPartnerData({...partnerData, adresse: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input 
                    type="text" 
                    value={partnerData.ville}
                    onChange={(e) => setPartnerData({...partnerData, ville: e.target.value})}
                    className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                    <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pays
                  </label>
                  <input 
                    type="text" 
                    value={partnerData.pays}
                    onChange={(e) => setPartnerData({...partnerData, pays: e.target.value})}
                    className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
                    <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea 
                  value={partnerData.description}
                  onChange={(e) => setPartnerData({...partnerData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Décrivez votre entreprise..."
                />
                  </div>
                  
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date d'adhésion: {formatDate(partnerData.date_adhesion)}</span>
                </div>
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

        {activeTab === 'securite' && (
        <div className="max-w-2xl">
          <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Sécurité du compte
            </h2>
            
            <div className="space-y-6">
              {/* Changement de mot de passe */}
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Changer le mot de passe
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="Entrez votre nouveau mot de passe"
                        className="w-full pl-10 pr-12 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="Confirmez votre nouveau mot de passe"
                        className="w-full pl-10 pr-12 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 "
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                  </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--zalama-green)] text-white rounded-lg hover:bg-[var(--zalama-green-accent)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isChangingPassword ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent bg-[var(--zalama-green)]" />
                      ) : (
                      <Save className="w-4 h-4" />
                      )}
                      {isChangingPassword ? 'Changement...' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Informations de sécurité */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Informations de sécurité
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Dernière connexion: {session?.admin?.last_login ? formatDate(session.admin.last_login) : 'Non disponible'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Rôle: {session?.admin?.role || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Compte créé: {session?.admin?.created_at ? formatDate(session.admin.created_at) : 'Non disponible'}</span>
                  </div>
                </div>
              </div>

              {/* Conseils de sécurité */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Conseils de sécurité
                </h4>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Utilisez un mot de passe d'au moins 8 caractères</li>
                  <li>• Incluez des lettres, chiffres et caractères spéciaux</li>
                  <li>• Ne partagez jamais vos identifiants</li>
                  <li>• Changez votre mot de passe régulièrement</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        )}

      {activeTab === 'apparence' && (
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
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Sun className="w-5 h-5 text-yellow-600" />
                    </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Clair</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Thème lumineux</div>
                  </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <Moon className="w-5 h-5 text-gray-100" />
                    </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Sombre</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Thème sombre</div>
                  </div>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Informations sur le thème actuel */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Palette className="w-5 h-5" />
                  <span className="font-medium">Thème actuel: {theme === 'light' ? 'Clair' : 'Sombre'}</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Votre choix est automatiquement sauvegardé et synchronisé sur tous vos appareils.
                </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
