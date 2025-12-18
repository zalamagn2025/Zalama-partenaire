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
  // Authentification
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
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
 */
export const getDefaultHeaders = (accessToken?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
};

