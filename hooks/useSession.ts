"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  partenaire_id: string;
  active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  require_password_change: boolean;
}

export interface Partner {
  id: string;
  company_name: string;
  legal_status: string;
  rccm: string;
  nif: string;
  activity_domain: string;
  headquarters_address: string;
  phone: string;
  email: string;
  employees_count: number;
  payroll: string;
  cdi_count: number;
  cdd_count: number;
  payment_date: string;
  rep_full_name: string;
  rep_position: string;
  rep_email: string;
  rep_phone: string;
  hr_full_name: string;
  hr_email: string;
  hr_phone: string;
  agreement: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  motivation_letter_url?: string;
  motivation_letter_text?: string;
  payment_day?: number;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User;
  admin: AdminUser;
  partner: Partner;
}

interface UseSessionReturn {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any; session?: AuthSession | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearCache: () => void;
  forceRefresh: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Cache pour éviter les requêtes répétées
  const sessionCache = new Map<string, AuthSession>();

  const loadUserSession = async (authUser: User): Promise<AuthSession | null> => {
    try {
      console.log('Chargement session pour:', authUser.email);
      
      // Vérifier le cache d'abord
      const cacheKey = authUser.id;
      if (sessionCache.has(cacheKey)) {
        console.log('Session récupérée depuis le cache');
        return sessionCache.get(cacheKey)!;
      }
      
      // Récupérer les vraies données depuis admin_users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authUser.id)
        .eq('active', true)
        .single();
      
      if (adminError || !adminData) {
        console.log('Admin non trouvé, tentative de récupération depuis users...');
        
        // Fallback: essayer de récupérer depuis la table users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        if (userError || !userData) {
          throw new Error('Utilisateur non autorisé - profil non trouvé');
        }

        // Créer un profil admin basique à partir des données users
        const adminUser: AdminUser = {
          id: authUser.id,
          email: authUser.email,
          display_name: userData.nom + ' ' + userData.prenom,
          role: 'admin',
          partenaire_id: authUser.id,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          require_password_change: false
        };

        // Créer un partenaire basique
        const partnerData: Partner = {
          id: authUser.id,
          company_name: userData.organisation || 'Entreprise',
          legal_status: 'SARL',
          rccm: 'RCCM/GN/CON/2024/001',
          nif: 'NIF123456789',
          activity_domain: 'Technologie',
          headquarters_address: userData.adresse || 'Conakry, Guinée',
          phone: userData.telephone || '+224 123 456 789',
          email: authUser.email,
          employees_count: 10,
          payroll: 'Mensuel',
          cdi_count: 5,
          cdd_count: 2,
          payment_date: new Date().toISOString().split('T')[0],
          rep_full_name: userData.nom + ' ' + userData.prenom,
          rep_position: userData.poste || 'Directeur',
          rep_email: authUser.email,
          rep_phone: userData.telephone || '+224 123 456 789',
          hr_full_name: userData.nom + ' ' + userData.prenom,
          hr_email: authUser.email,
          hr_phone: userData.telephone || '+224 123 456 789',
          agreement: true,
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const fallbackSession = {
          user: authUser,
          admin: adminUser,
          partner: partnerData
        };
        
        // Mettre en cache
        sessionCache.set(cacheKey, fallbackSession);
        return fallbackSession;
      }

      // Récupérer les vraies données partenaire depuis partners
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', adminData.partenaire_id)
        .eq('status', 'approved')
        .single();

      if (partnerError || !partnerData) {
        throw new Error('Partenaire introuvable ou non approuvé');
      }
      
      // Mettre à jour la dernière connexion
      await supabase
        .from('admin_users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);

      const fullSession = {
        user: authUser,
        admin: { ...adminData, last_login: new Date().toISOString() },
        partner: partnerData
      };
      
      // Mettre en cache
      sessionCache.set(cacheKey, fullSession);
      console.log('Session récupérée avec succès depuis admin_users et partners');
      return fullSession;
    } catch (error) {
      console.error('Erreur chargement session:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vider le cache pour forcer la récupération des nouvelles données
      sessionCache.clear();
      
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession?.user) {
        const fullSession = await loadUserSession(supabaseSession.user);
        setSession(fullSession);
      } else {
        setSession(null);
      }
    } catch (error: any) {
      setError(error.message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (supabaseSession?.user && mounted) {
          const fullSession = await loadUserSession(supabaseSession.user);
          setSession(fullSession);
        }
      } catch (error: any) {
        if (mounted) {
          console.error('Erreur initialisation session:', error);
          setError(error.message);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Ne s'initialiser qu'une seule fois
    if (!initialized) {
      initializeSession();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && supabaseSession?.user) {
        try {
          const fullSession = await loadUserSession(supabaseSession.user);
          setSession(fullSession);
          setError(null);
        } catch (error: any) {
          setError(error.message);
          setSession(null);
          await supabase.auth.signOut();
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setError(null);
      } else if (event === 'TOKEN_REFRESHED' && supabaseSession?.user) {
        try {
          const fullSession = await loadUserSession(supabaseSession.user);
          setSession(fullSession);
          setError(null);
        } catch (error: any) {
          setError(error.message);
          setSession(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return { error: authError };
      }

      if (!authData.user) {
        const error = { message: 'Erreur lors de la connexion' };
        setError(error.message);
        return { error };
      }

      const fullSession = await loadUserSession(authData.user);
      setSession(fullSession);
      
      return { error: null, session: fullSession };
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      sessionCache.clear(); // Vider le cache à la déconnexion
      await supabase.auth.signOut();
      setSession(null);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    sessionCache.clear();
    console.log('Cache vidé');
  };

  const forceRefresh = async () => {
    try {
      setLoading(true);
      sessionCache.clear(); // Vider le cache
      
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession?.user) {
        const fullSession = await loadUserSession(supabaseSession.user);
        setSession(fullSession);
        console.log('Session forcée mise à jour depuis la BD');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
    clearCache,
    forceRefresh
  };
}
