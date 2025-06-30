"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Partner, User as CustomUser } from '@/lib/supabase';
import { partnerService } from '@/lib/services';
import { createHash } from 'crypto';

interface AuthContextType {
  user: CustomUser | null;
  partner: Partner | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshPartner: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fonction pour hasher un mot de passe
const hashPassword = (password: string) => {
  return createHash('sha256').update(password).digest('hex');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'utilisateur actuel au chargement depuis le localStorage
    const checkUser = async () => {
      try {
        const savedUser = localStorage.getItem('zalama_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          // Charger le partenaire seulement après avoir défini l'utilisateur
          await loadPartner(userData.email);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Effet pour recharger le partenaire quand l'utilisateur change
  useEffect(() => {
    if (user?.email) {
      loadPartner(user.email);
    }
  }, [user]);

  const loadPartner = async (email: string) => {
    try {
      // Attendre que l'utilisateur soit défini
      if (!user?.id) {
        return;
      }
      
      // D'abord essayer de récupérer par l'ID de l'utilisateur
      const { data, error } = await partnerService.getPartnerByUserId(user.id);
      
      if (!error && data) {
        setPartner(data);
        return;
      }
      
      // Si l'utilisateur est RH, chercher le partenaire par organisation
      if (user.organisation && user.poste?.toLowerCase().includes('rh')) {
        // Récupérer le premier partenaire correspondant exactement à l'organisation
        const { data: orgData, error: orgError } = await supabase
          .from('partners')
          .select('*')
          .eq('nom', user.organisation)
          .limit(1);
        
        if (orgData && orgData.length > 0) {
          setPartner(orgData[0]);
          return;
        }
        
        // Si pas trouvé, essayer une correspondance partielle
        const { data: partialData, error: partialError } = await supabase
          .from('partners')
          .select('*')
          .ilike('nom', `%${user.organisation}%`)
          .limit(1);
        
        if (partialData && partialData.length > 0) {
          setPartner(partialData[0]);
          return;
        }
      }
      
      // Fallback: essayer par email seulement si c'est un email valide et si l'ID n'a pas fonctionné
      if (email && email.includes('@') && !email.includes('-')) {
        const { data: emailData, error: emailError } = await partnerService.getPartnerByEmail(email);
        
        if (emailError) {
          console.error('Erreur lors du chargement du partenaire:', emailError);
          return;
        }
        
        if (emailData) {
          setPartner(emailData);
        }
      } else {
        // Si l'email est un UUID, essayer de récupérer le partenaire directement par l'ID
        const { data: directData, error: directError } = await partnerService.getPartnerById(user.id);
        
        if (!directError && directData) {
          setPartner(directData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du partenaire:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Vérifier les identifiants dans la table users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('actif', true)
        .single();

      if (userError || !users) {
        return { error: { message: 'Identifiants invalides' } };
      }

      // Vérifier le hash du mot de passe
      const passwordHash = hashPassword(password);
      if (users.encrypted_password !== passwordHash) {
        return { error: { message: 'Mot de passe incorrect' } };
      }

      // Connexion réussie
      const userData: CustomUser = {
        id: users.id,
        email: users.email,
        nom: users.nom,
        prenom: users.prenom,
        telephone: users.telephone,
        adresse: users.adresse,
        type: users.type,
        statut: users.statut,
        photo_url: users.photo_url,
        organisation: users.organisation,
        poste: users.poste,
        niveau_etudes: users.niveau_etudes,
        etablissement: users.etablissement,
        date_inscription: users.date_inscription,
        derniere_connexion: users.derniere_connexion,
        actif: users.actif,
        created_at: users.created_at,
        updated_at: users.updated_at
      };

      // Sauvegarder l'utilisateur dans le localStorage
      localStorage.setItem('zalama_user', JSON.stringify(userData));
      
      // Créer un cookie pour le middleware
      document.cookie = `zalama_user=${JSON.stringify(userData)}; path=/; max-age=86400; SameSite=Lax`;
      
      setUser(userData);
      
      // Charger les données du partenaire
      await loadPartner(userData.email);
      
      return { error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { error: { message: 'Erreur de connexion' } };
    }
  };

  const signOut = async () => {
    try {
      // Supprimer l'utilisateur du localStorage
      localStorage.removeItem('zalama_user');
      
      // Supprimer le cookie
      document.cookie = 'zalama_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      setUser(null);
      setPartner(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const refreshPartner = async () => {
    if (user?.email) {
      await loadPartner(user.email);
    }
  };

  const value = {
    user,
    partner,
    loading,
    signIn,
    signOut,
    refreshPartner
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
