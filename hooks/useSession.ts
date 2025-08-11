"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
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
  cacheStats: { size: number; hits: number; misses: number };
}

// Cache global pour partager entre les instances
const globalSessionCache = new Map<string, { data: AuthSession; timestamp: number; ttl: number }>();
const cacheStats = { hits: 0, misses: 0 };

// Configuration du cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Nombre maximum d'entrées en cache

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Références pour les timers et subscriptions
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeSubscriptionsRef = useRef<any[]>([]);
  const lastRefreshRef = useRef<number>(0);
  
  // Fonction de nettoyage du cache expiré
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of globalSessionCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        globalSessionCache.delete(key);
        console.log(`Cache expiré supprimé pour: ${key}`);
      }
    }
    
    // Limiter la taille du cache si nécessaire
    if (globalSessionCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(globalSessionCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, globalSessionCache.size - MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => {
        globalSessionCache.delete(key);
        console.log(`Cache supprimé pour limiter la taille: ${key}`);
      });
    }
  }, []);

  // Fonction de gestion intelligente du cache
  const getCachedSession = useCallback((userId: string): AuthSession | null => {
    const entry = globalSessionCache.get(userId);
    if (!entry) {
      cacheStats.misses++;
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      globalSessionCache.delete(userId);
      cacheStats.misses++;
      console.log(`Cache expiré pour: ${userId}`);
      return null;
    }
    
    cacheStats.hits++;
    console.log(`Session récupérée depuis le cache pour: ${userId}`);
    return entry.data;
  }, []);

  // Fonction de mise en cache intelligente
  const setCachedSession = useCallback((userId: string, sessionData: AuthSession) => {
    globalSessionCache.set(userId, {
      data: sessionData,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });
    console.log(`Session mise en cache pour: ${userId}`);
    
    // Nettoyer le cache si nécessaire
    if (globalSessionCache.size > MAX_CACHE_SIZE) {
      cleanupExpiredCache();
    }
  }, [cleanupExpiredCache]);

  const loadUserSession = async (authUser: User): Promise<AuthSession | null> => {
    try {
      console.log('Chargement session pour:', authUser.email);
      
      // Vérifier le cache d'abord
      const cachedSession = getCachedSession(authUser.id);
      if (cachedSession) {
        return cachedSession;
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
          email: authUser.email || '',
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
          email: authUser.email || '',
          employees_count: 10,
          payroll: 'Mensuel',
          cdi_count: 5,
          cdd_count: 2,
          payment_date: new Date().toISOString().split('T')[0],
          rep_full_name: userData.nom + ' ' + userData.prenom,
          rep_position: userData.poste || 'Directeur',
          rep_email: authUser.email || '',
          rep_phone: userData.telephone || '+224 123 456 789',
          hr_full_name: userData.nom + ' ' + userData.prenom,
          hr_email: authUser.email || '',
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
        setCachedSession(authUser.id, fallbackSession);
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
      setCachedSession(authUser.id, fullSession);
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
      clearCache();
      
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession?.user) {
        const fullSession = await loadUserSession(supabaseSession.user);
        setSession(fullSession);
        lastRefreshRef.current = Date.now();
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
          lastRefreshRef.current = Date.now();
          
          // Activer les listeners en temps réel IMMÉDIATEMENT
          setupRealtimeListeners(supabaseSession.user);
        }
      } catch (error: any) {
        if (mounted) {
          console.error('Erreur lors de l\'initialisation de la session:', error);
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
          lastRefreshRef.current = Date.now();
          
          // Activer les listeners en temps réel APRÈS CONNEXION
          setupRealtimeListeners(supabaseSession.user);
        } catch (error: any) {
          console.error('Erreur lors de la création de session après connexion:', error);
          setError(error.message);
          setSession(null);
          await supabase.auth.signOut();
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setError(null);
        
        // Nettoyer les listeners en temps réel
        cleanupRealtimeListeners();
        
        // Nettoyer l'interval automatique
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
          autoRefreshIntervalRef.current = null;
        }
      } else if (event === 'TOKEN_REFRESHED' && supabaseSession?.user) {
        try {
          const fullSession = await loadUserSession(supabaseSession.user);
          setSession(fullSession);
          setError(null);
          lastRefreshRef.current = Date.now();
        } catch (error: any) {
          console.error('Erreur lors de la mise à jour après refresh du token:', error);
          setError(error.message);
          setSession(null);
        }
      } else if (event === 'USER_UPDATED' && supabaseSession?.user) {
        try {
          const fullSession = await loadUserSession(supabaseSession.user);
          setSession(fullSession);
          setError(null);
          lastRefreshRef.current = Date.now();
        } catch (error: any) {
          console.error('Erreur lors de la mise à jour après modification utilisateur:', error);
          setError(error.message);
          setSession(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      
      // Nettoyer les listeners en temps réel
      cleanupRealtimeListeners();
      
      // Nettoyer l'interval automatique
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
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
      lastRefreshRef.current = Date.now();
      
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
      clearCache(); // Vider le cache à la déconnexion
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
    globalSessionCache.clear();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
  };

  const forceRefresh = async () => {
    try {
      setLoading(true);
      clearCache(); // Vider le cache
      
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession?.user) {
        const fullSession = await loadUserSession(supabaseSession.user);
        setSession(fullSession);
        lastRefreshRef.current = Date.now();
        console.log('Session forcée mise à jour depuis la BD');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de nettoyage des listeners en temps réel
  const cleanupRealtimeListeners = useCallback(() => {
    realtimeSubscriptionsRef.current.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (error) {
        console.error('Erreur lors de la désinscription:', error);
      }
    });
    
    realtimeSubscriptionsRef.current = [];
  }, []);

  // Écouter les changements en temps réel avec gestion d'erreurs améliorée
  const setupRealtimeListeners = useCallback((authUser: User) => {
    // Nettoyer les anciens listeners
    cleanupRealtimeListeners();
    
    const subscriptions: any[] = [];
    
    try {
      // Écouter les changements dans admin_users
      const adminSubscription = supabase
        .channel(`admin_users_changes_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'admin_users',
            filter: `id=eq.${authUser.id}`
          },
          async (payload) => {
            try {
              // Vider le cache et recharger
              clearCache();
              const fullSession = await loadUserSession(authUser);
              if (fullSession) {
                setSession(fullSession);
                lastRefreshRef.current = Date.now();
              }
            } catch (error) {
              console.error('Erreur lors de la mise à jour automatique (admin_users):', error);
            }
          }
        )
        .subscribe();
      
      subscriptions.push(adminSubscription);
      
      // Écouter les changements dans partners
      const partnerSubscription = supabase
        .channel(`partners_changes_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'partners',
            filter: `id=eq.${authUser.id}`
          },
          async (payload) => {
            try {
              clearCache();
              const fullSession = await loadUserSession(authUser);
              if (fullSession) {
                setSession(fullSession);
                lastRefreshRef.current = Date.now();
              }
            } catch (error) {
              console.error('Erreur lors de la mise à jour automatique (partners):', error);
            }
          }
        )
        .subscribe();
      
      subscriptions.push(partnerSubscription);
      
      // Écouter les changements dans avis
      const avisSubscription = supabase
        .channel(`avis_changes_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'avis',
            filter: `partenaire_id=eq.${authUser.id}`
          },
          async (payload) => {
            try {
              clearCache();
              const fullSession = await loadUserSession(authUser);
              if (fullSession) {
                setSession(fullSession);
                lastRefreshRef.current = Date.now();
              }
            } catch (error) {
              console.error('Erreur lors de la mise à jour automatique (avis):', error);
            }
          }
        )
        .subscribe();
      
      subscriptions.push(avisSubscription);
      
      realtimeSubscriptionsRef.current = subscriptions;
      
      // Démarrer le refresh automatique intelligent
      startAutoRefresh(authUser);
      
    } catch (error) {
      console.error('Erreur lors de la configuration des listeners temps réel:', error);
    }
  }, [cleanupRealtimeListeners]);

  // Refresh automatique intelligent avec gestion d'erreurs
  const startAutoRefresh = useCallback((authUser: User) => {
    // Nettoyer l'interval précédent
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }
    
    const interval = setInterval(async () => {
      try {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;
        
        // Ne rafraîchir que si plus de 5 minutes se sont écoulées
        if (timeSinceLastRefresh >= REFRESH_INTERVAL) {
          // Vérifier si l'utilisateur est toujours connecté
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession?.user) {
            clearInterval(interval);
            return;
          }
          
          clearCache();
          const fullSession = await loadUserSession(authUser);
          if (fullSession) {
            setSession(fullSession);
            lastRefreshRef.current = now;
          }
        }
      } catch (error) {
        console.error('Erreur lors du refresh automatique:', error);
      }
    }, REFRESH_INTERVAL);
    
    autoRefreshIntervalRef.current = interval;
    
  }, []);

  // Nettoyage du cache expiré toutes les minutes
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupExpiredCache, 60 * 1000);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [cleanupExpiredCache]);

  return {
    session,
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
    clearCache,
    forceRefresh,
    cacheStats: { 
      size: globalSessionCache.size, 
      hits: cacheStats.hits, 
      misses: cacheStats.misses 
    }
  };
}
