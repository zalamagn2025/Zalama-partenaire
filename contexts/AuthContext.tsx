"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Types pour le nouveau système d'authentification
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
  nom: string;
  type: string;
  secteur: string;
  description?: string;
  nom_representant?: string;
  email_representant?: string;
  telephone_representant?: string;
  nom_rh?: string;
  email_rh?: string;
  telephone_rh?: string;
  rccm?: string;
  nif?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  site_web?: string;
  logo_url?: string;
  date_adhesion: string;
  actif: boolean;
  nombre_employes: number;
  salaire_net_total: number;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User;           // Utilisateur Supabase auth.users
  admin: AdminUser;     // Profil admin_users
  partner: Partner;     // Données du partenaire
}

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; session?: AuthSession | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au chargement et écouter les changements
    initializeAuth();
    
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      console.log('Auth state change:', event, supabaseSession?.user?.id);
      
      if (event === 'SIGNED_IN' && supabaseSession?.user) {
        try {
          const fullSession = await loadUserSession(supabaseSession.user);
          if (fullSession) {
            setSession(fullSession);
            console.log('Session loaded and stored successfully');
          }
        } catch (error) {
          console.error('Error loading session after sign in:', error);
          await supabase.auth.signOut();
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        localStorage.removeItem('zalama_session');
        document.cookie = 'zalama_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        console.log('Session cleared after sign out');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
      try {
      // 1. Vérifier d'abord le localStorage pour une restauration rapide
      const savedSession = localStorage.getItem('zalama_session');
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          setSession(parsedSession);
          console.log('Session restored from localStorage');
                 } catch (parseError) {
           console.error('Error parsing saved session:', parseError);
           localStorage.removeItem('zalama_session');
           document.cookie = 'zalama_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
         }
      }

      // 2. Vérifier la session Supabase actuelle
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession?.user) {
        try {
          const fullSession = await loadUserSession(supabaseSession.user);
          if (fullSession) {
            setSession(fullSession);
            console.log('Session verified and updated from Supabase');
          }
        } catch (error) {
          console.error('Error verifying session:', error);
                     await supabase.auth.signOut();
           setSession(null);
           localStorage.removeItem('zalama_session');
           document.cookie = 'zalama_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } else if (savedSession) {
                 // Si pas de session Supabase mais session locale, nettoyer
         setSession(null);
         localStorage.removeItem('zalama_session');
         document.cookie = 'zalama_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
         console.log('Cleared invalid local session');
        }
      } catch (error) {
      console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

  const loadUserSession = async (authUser: User): Promise<AuthSession | null> => {
    try {
      console.log('Loading user session for:', authUser.id);
      
      // 1. Vérifier dans admin_users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authUser.id)
        .eq('active', true)
        .single();
      
      if (adminError || !adminData) {
        throw new Error('Utilisateur non autorisé - Profil admin introuvable');
      }
      
      // 2. Vérifier le rôle (RH ou Responsable)
      if (!['rh', 'responsable'].includes(adminData.role.toLowerCase())) {
        throw new Error(`Accès refusé - Rôle non autorisé: ${adminData.role}`);
      }

      // 3. Charger le partenaire
      if (!adminData.partenaire_id) {
        throw new Error('Aucun partenaire associé à cet utilisateur');
      }

      const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('*')
        .eq('id', adminData.partenaire_id)
        .eq('actif', true)
        .single();

      if (partnerError || !partnerData) {
        throw new Error('Partenaire introuvable ou inactif');
      }
      
      // 4. Mettre à jour last_login
      await supabase
        .from('admin_users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);

      // 5. Créer la session complète
      const fullSession: AuthSession = {
        user: authUser,
        admin: { ...adminData, last_login: new Date().toISOString() },
        partner: partnerData
      };

      // 6. Sauvegarder dans localStorage immédiatement
      localStorage.setItem('zalama_session', JSON.stringify(fullSession));
      
      // 7. Créer un cookie simple pour le middleware
      const sessionCookie = {
        admin: { id: adminData.id, role: adminData.role },
        partner: { id: partnerData.id, actif: partnerData.actif }
      };
      document.cookie = `zalama_session=${encodeURIComponent(JSON.stringify(sessionCookie))}; path=/; max-age=86400; SameSite=Lax`;
      
      console.log('Session saved to localStorage and cookie');

      return fullSession;
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      // 1. Authentification avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return { error: authError };
      }

      if (!authData.user) {
        return { error: { message: 'Erreur lors de la connexion' } };
      }

      console.log('Supabase auth successful, loading user session...');

      // 2. Charger la session complète immédiatement
      const fullSession = await loadUserSession(authData.user);
      if (fullSession) {
        setSession(fullSession);
        console.log('Sign in completed successfully');
        return { error: null, session: fullSession };
      } else {
        return { error: { message: 'Erreur lors du chargement de la session' } };
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      return { error: { message: error.message || 'Erreur de connexion' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
      localStorage.removeItem('zalama_session');
      document.cookie = 'zalama_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setSession(null);
      console.log('Sign out completed');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const value = {
    session,
    loading,
    signIn,
    signOut
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
