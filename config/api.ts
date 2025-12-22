/**
 * Configuration de l'API ZaLaMa
 * Base URL: https://sandbox.zalamagn.com
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sandbox.zalamagn.com',
  timeout: 30000, // 30 secondes
} as const;

/**
 * Routes de l'API ZaLaMa
 */
export const API_ROUTES = {
  // Authentification générique (pour admin/front office)
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
  },
  
  // Authentification partenaire
  partnerAuth: {
    login: '/partner-auth/login',
    getme: '/partner-auth/getme',
    apiKey: '/partner-auth/api-key',
    regenerateApiKey: '/partner-auth/regenerate-api-key',
  },
  
  // Dashboard partenaire
  partnerDashboard: {
    dashboardData: '/partner-dashboard/dashboard-data',
    data: '/partner-dashboard/data',
  },
  
  // Demandes d'adhésion
  partnerDemandeAdhesion: {
    list: '/partner-demande-adhesion',
    getById: (id: string) => `/partner-demande-adhesion/${id}`,
    approve: (id: string) => `/partner-demande-adhesion/${id}/approve`,
    reject: (id: string) => `/partner-demande-adhesion/${id}/reject`,
    stats: '/partner-demande-adhesion/stats',
  },
  
  // Employés
  partnerEmployee: {
    list: '/partner-employee',
    listAlias: '/partner-employe',
    avis: '/partner-employee/avis',
    stats: '/partner-employee/stats',
  },
  
  // Finances
  partnerFinances: {
    demandes: '/partner-finances/demandes',
    remboursements: '/partner-finances/remboursements',
    stats: '/partner-finances/stats',
    evolutionMensuelle: '/partner-finances/evolution-mensuelle',
    partnerEmployeeStats: '/partner-finances/partner-employee-stats',
  },
  
  // Informations partenaire
  partnerInfo: {
    get: '/partner-info',
  },
  
  // Partenaires
  partners: {
    list: '/partners',
    get: (id: string) => `/partners/${id}`,
    update: (id: string) => `/partners/${id}`,
  },
  
  // Employés
  employees: {
    list: '/employees',
    get: (id: string) => `/employees/${id}`,
    create: '/employees',
    update: (id: string) => `/employees/${id}`,
    delete: (id: string) => `/employees/${id}`,
  },
  
  // Demandes d'avance sur salaire
  salaryAdvanceRequests: {
    list: '/salary-advance-requests',
    get: (id: string) => `/salary-advance-requests/${id}`,
    create: '/salary-advance-requests',
    update: (id: string) => `/salary-advance-requests/${id}`,
    approve: (id: string) => `/salary-advance-requests/${id}/approve`,
    reject: (id: string) => `/salary-advance-requests/${id}/reject`,
  },
  
  // Paiements
  payments: {
    list: '/payments',
    get: (id: string) => `/payments/${id}`,
    create: '/payments',
    execute: (id: string) => `/payments/${id}/execute`,
    status: (id: string) => `/payments/${id}/status`,
  },
  
  // Paiements partenaire
  partnerPayments: {
    list: '/partner-payments',
    employees: '/partner-payments/employees',
    statistics: '/partner-payments/statistics',
    batchProcessWallet: '/partner-payments/batch/process-wallet',
    bulletinPaie: '/partner-payments/bulletin-paie',
  },
  
  // Remboursements
  reimbursements: {
    list: '/reimbursements',
    get: (id: string) => `/reimbursements/${id}`,
    create: '/reimbursements',
    update: (id: string) => `/reimbursements/${id}`,
    pay: (id: string) => `/reimbursements/${id}/pay`,
  },
  
  // Bulletins de paie
  paySlips: {
    list: '/pay-slips',
    get: (id: string) => `/pay-slips/${id}`,
    generate: '/pay-slips/generate',
    export: (id: string) => `/pay-slips/${id}/export`,
    exportMonthly: (month: string, year: number) => `/pay-slips/export/${year}/${month}`,
  },
  
  // Statistiques
  statistics: {
    dashboard: '/statistics/dashboard',
    financial: '/statistics/financial',
    employees: '/statistics/employees',
  },
  
  // Notifications
  notifications: {
    list: '/notifications',
    get: (id: string) => `/notifications/${id}`,
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: '/notifications/read-all',
  },
} as const;

/**
 * Fonction helper pour construire l'URL complète
 */
export const getApiUrl = (route: string): string => {
  return `${API_CONFIG.baseURL}${route}`;
};

/**
 * Headers par défaut pour les requêtes
 * Pour les routes de login (/auth/login, /partner-auth/login), on ne doit PAS envoyer de token
 */
export const getDefaultHeaders = (accessToken?: string, route?: string): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Ne pas ajouter le token pour les routes de login
  const isLoginRoute = route?.includes('/login') || route?.includes('/auth/login') || route?.includes('/partner-auth/login');
  
  if (accessToken && !isLoginRoute) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers as HeadersInit;
};

