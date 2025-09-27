// Service pour interagir avec les Edge Functions Supabase
// Edge Function: partner-auth

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-auth`;
const DASHBOARD_EDGE_FUNCTION_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-dashboard-data`;
const PARTNER_FINANCES_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-finances`;
const PARTNER_REIMBURSEMENTS_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-reimbursements`;
const PARTNER_APPROVAL_URL = `${SUPABASE_URL}/functions/v1/partner-approval`;

export interface PartnerAuthResponse {
  success: boolean;
  message: string;
  user?: {
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
  };
  partner_info?: {
    id: string;
    company_name: string;
    legal_status: string;
    activity_domain: string;
    email: string;
    phone: string;
    address: string;
    logo_url?: string;
    employees_count: number;
    active_employees_count: number;
    total_salary: number;
    avg_salary: number;
    created_at: string;
    updated_at: string;
  };
  access_token?: string;
  refresh_token?: string;
  data?: any;
  count?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface CreateEmployeeAccountRequest {
  employee_id: string;
}

export interface SendOtpRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  sessionId: string;
  otp: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ApprovalRequest {
  requestId: string;
  action: "approve" | "reject";
  approverId: string;
  approverRole: "rh" | "responsable";
  reason?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    newStatus: string;
    approverRole: string;
    reason?: string;
  };
}

export interface DashboardDataResponse {
  success: boolean;
  message: string;
  data: {
    statistics: {
      total_employees: number;
      active_employees: number;
      total_demandes: number;
      demandes_per_employee: string;
      average_rating: string;
      pending_demandes: number;
      total_alerts: number;
      active_alerts: number;
      total_avis: number;
      total_salary: number;
      flux_finance: number;
      a_rembourser_mois: number;
    };
    financial_performance: {
      debloque_mois: number;
      a_rembourser_mois: number;
      taux_remboursement: string;
      date_limite_remboursement: string;
      jours_restants: string;
      employes_approuves_periode: number;
      dernier_paiement: string;
      prochain_paiement: string;
      payment_day: number;
    };
    charts: {
      demandes_evolution: Array<{ mois: string; demandes: number }>;
      montants_evolution: Array<{ mois: string; montant: number }>;
      repartition_motifs: Array<{ motif: string; valeur: number; color: string }>;
    };
    partner_info: {
      id: string;
      company_name: string;
      legal_status: string;
      activity_domain: string;
      email: string;
      phone: string;
      logo_url: string;
      employees_count: number;
      active_employees_count: number;
      total_salary: number;
      avg_salary: number;
      payment_day: number;
      created_at: string;
      updated_at: string;
    };
    filters: {
      month: number | null;
      year: number | null;
      payment_day: number;
      applied: boolean;
      period_start: string;
      period_end: string;
      period_description: string;
    };
    employees?: any[];
    remboursements?: any[];
    alerts?: any[];
    avis?: any[];
    demandes?: any[];
  };
}

class EdgeFunctionService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async makeLocalRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Ajouter le token d'authentification si disponible
    if (this.accessToken) {
      defaultHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Gestion spécifique des erreurs 401 (non autorisé)
        if (response.status === 401) {
          // Vérifier si c'est une erreur de connexion ou de session expirée
          const errorMessage = data.message || data.error || "";
          if (
            errorMessage.toLowerCase().includes("invalid credentials") ||
            errorMessage.toLowerCase().includes("email") ||
            errorMessage.toLowerCase().includes("password")
          ) {
            throw new Error(
              "Email ou mot de passe incorrect. Veuillez réessayer."
            );
          } else {
            throw new Error("Session expirée. Veuillez vous reconnecter.");
          }
        }

        // Gestion spécifique des erreurs 403 (accès interdit)
        if (response.status === 403) {
          throw new Error("Accès non autorisé. Vérifiez vos permissions.");
        }

        // Gestion spécifique des erreurs 404 (non trouvé)
        if (response.status === 404) {
          throw new Error("Ressource non trouvée.");
        }

        // Gestion spécifique des erreurs 500 (erreur serveur)
        if (response.status === 500) {
          throw new Error("Erreur serveur. Veuillez réessayer plus tard.");
        }

        // Erreur générique avec le message du serveur
        throw new Error(
          data.message || data.error || `Erreur ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error(`Erreur Proxy Local ${url}:`, error);

      // Si c'est déjà une erreur formatée, la relancer
      if (error instanceof Error) {
        throw error;
      }

      // Sinon, créer une erreur générique
      throw new Error(`Erreur de connexion au serveur: ${error}`);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    useDashboardApi: boolean = false,
    useFinancesApi: boolean = false,
    useReimbursementsApi: boolean = false,
    filters: any = {}
  ): Promise<T> {
    // Utiliser les proxies locaux pour les endpoints salary-demands
    if (endpoint.startsWith('/salary-demands')) {
      const url = `/api/proxy${endpoint}`;
      return this.makeLocalRequest<T>(url, options);
    }
    
    // Utiliser les proxies locaux pour les endpoints partner-finances
    if (useFinancesApi) {
      const url = `/api/proxy/partner-finances${endpoint}`;
      return this.makeLocalRequest<T>(url, options);
    }
    
    // Utiliser les proxies locaux pour les endpoints partner-reimbursements
    if (useReimbursementsApi) {
      let url = `/api/proxy/partner-reimbursements${endpoint}`;
      
      // Ajouter les filtres comme paramètres de requête
      if (Object.keys(filters).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, String(value));
          }
        });
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }
      
      return this.makeLocalRequest<T>(url, options);
    }
    
    let baseUrl = EDGE_FUNCTION_BASE_URL;
    if (useDashboardApi) {
      baseUrl = DASHBOARD_EDGE_FUNCTION_BASE_URL;
    }
    const url = `${baseUrl}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Ajouter le token d'authentification si disponible
    if (this.accessToken) {
      defaultHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Gestion spécifique des erreurs 401 (non autorisé)
        if (response.status === 401) {
          // Vérifier si c'est une erreur de connexion ou de session expirée
          const errorMessage = data.message || data.error || "";
          if (
            errorMessage.toLowerCase().includes("invalid credentials") ||
            errorMessage.toLowerCase().includes("email") ||
            errorMessage.toLowerCase().includes("password")
          ) {
            throw new Error(
              "Email ou mot de passe incorrect. Veuillez réessayer."
            );
          } else {
            throw new Error("Session expirée. Veuillez vous reconnecter.");
          }
        }

        // Gestion spécifique des erreurs 403 (accès interdit)
        if (response.status === 403) {
          throw new Error("Accès non autorisé. Vérifiez vos permissions.");
        }

        // Gestion spécifique des erreurs 404 (non trouvé)
        if (response.status === 404) {
          throw new Error("Ressource non trouvée.");
        }

        // Gestion spécifique des erreurs 500 (erreur serveur)
        if (response.status === 500) {
          throw new Error("Erreur serveur. Veuillez réessayer plus tard.");
        }

        // Erreur générique avec le message du serveur
        throw new Error(
          data.message || data.error || `Erreur ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error(`Erreur Edge Function ${endpoint}:`, error);

      // Si c'est déjà une erreur formatée, la relancer
      if (error instanceof Error) {
        throw error;
      }

      // Sinon, créer une erreur générique
      throw new Error(`Erreur de connexion au serveur: ${error}`);
    }
  }

  // 🔐 Authentification
  async login(credentials: LoginRequest): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // 📊 Dashboard Data - Nouvelles méthodes pour les Edge Functions
  async getDashboardData(): Promise<DashboardDataResponse> {
    return this.makeRequest<DashboardDataResponse>("/dashboard-data", {}, true);
  }



  async getAvis(): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/avis", {}, true);
  }

  async getDemandes(status?: string): Promise<PartnerAuthResponse> {
    const endpoint = status ? `/salary-demands?status=${encodeURIComponent(status)}` : "/salary-demands";
    return this.makeRequest<PartnerAuthResponse>(endpoint, {}, true);
  }

  async getAlerts(): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/alerts", {}, true);
  }

  async getStatistics(): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/statistics", {}, true);
  }

  // Nouvelles méthodes pour l'edge function partner-salary-demands
  async getSalaryDemands(filters?: {
    mois?: number;
    annee?: number;
    status?: string;
    employe_id?: string;
    type_motif?: string;
    date_debut?: string;
    date_fin?: string;
    categorie?: string;
    statut_remboursement?: string;
    limit?: number;
    offset?: number;
  }): Promise<PartnerAuthResponse> {
    let endpoint = "/salary-demands";
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }
    return this.makeRequest<PartnerAuthResponse>(endpoint, {}, true);
  }

  async getSalaryDemandsStatistics(filters?: {
    mois?: number;
    annee?: number;
    status?: string;
    employe_id?: string;
    type_motif?: string;
    date_debut?: string;
    date_fin?: string;
    categorie?: string;
    statut_remboursement?: string;
  }): Promise<PartnerAuthResponse> {
    let endpoint = "/salary-demands/statistics";
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }
    return this.makeRequest<PartnerAuthResponse>(endpoint, {}, true);
  }

  async getSalaryDemandsEmployees(): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/salary-demands/employees", {}, true);
  }

  async getSalaryDemandsActivityPeriods(): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/salary-demands/activity-periods", {}, true);
  }

  async createSalaryDemand(data: {
    employe_id: string;
    montant_demande: number;
    motif: string;
    type_motif: string;
    num_installments: number;
  }): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/salary-demands", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  }

  async updateSalaryDemand(id: string, data: {
    montant_demande?: number;
    motif?: string;
    type_motif?: string;
    commentaire_partenaire?: string;
    num_installments?: number;
  }): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>(`/salary-demands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, true);
  }

  async getPartnerInfo(): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/partner-info", {}, true);
  }

  // Méthodes de compatibilité (anciennes)


  async getDashboardAlerts(): Promise<PartnerAuthResponse> {
    return this.getAlerts();
  }

  async getDashboardAvis(): Promise<PartnerAuthResponse> {
    return this.getAvis();
  }

  // ========================================
  // MÉTHODES POUR L'EDGE FUNCTION PARTNER-FINANCES
  // ========================================

  async getFinancesStats(filters: {
    mois?: number;
    annee?: number;
    date_debut?: string;
    date_fin?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<PartnerAuthResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/stats?${queryString}` : '/stats';
    
    return this.makeRequest<PartnerAuthResponse>(url, {}, false, true);
  }

  async getFinancesRemboursements(filters: {
    mois?: number;
    annee?: number;
    date_debut?: string;
    date_fin?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<PartnerAuthResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/remboursements?${queryString}` : '/remboursements';
    
    return this.makeRequest<PartnerAuthResponse>(url, {}, false, true);
  }

  async getFinancesDemandes(filters: {
    mois?: number;
    annee?: number;
    date_debut?: string;
    date_fin?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<PartnerAuthResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/demandes?${queryString}` : '/demandes';
    
    return this.makeRequest<PartnerAuthResponse>(url, {}, false, true);
  }

  async getFinancesEvolutionMensuelle(annee?: number): Promise<PartnerAuthResponse> {
    const params = new URLSearchParams();
    if (annee !== undefined && annee !== null) {
      params.append('annee', annee.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/evolution-mensuelle?${queryString}` : '/evolution-mensuelle';
    
    return this.makeRequest<PartnerAuthResponse>(url, {}, false, true);
  }

  async getDashboardDemandes(status?: string): Promise<PartnerAuthResponse> {
    return this.getDemandes(status);
  }

  async getDashboardStatistics(): Promise<PartnerAuthResponse> {
    return this.getStatistics();
  }

  async getDashboardPartnerInfo(): Promise<PartnerAuthResponse> {
    return this.getPartnerInfo();
  }

  async getMe(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/getme", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/reset-password", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // 🏢 Informations du partenaire
  async getPartnerInfoWithToken(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/partner-info", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 👥 Employés
  async getEmployees(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/employees", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getEmployeesWithoutAccount(
    accessToken: string
  ): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/employees-without-account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async createEmployeeAccount(
    accessToken: string,
    request: CreateEmployeeAccountRequest
  ): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/create-employee-account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  // 📊 Statistiques
  async getStatisticsWithToken(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/statistics", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 💰 Remboursements
  async getRemboursements(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/remboursements", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 📋 Demandes
  async getDemandesWithToken(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/demandes", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 🔑 Clé API
  async getApiKey(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/api-key", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async regenerateApiKey(accessToken: string): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/regenerate-api-key", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 🔐 Changement de mot de passe admin
  async changeAdminPassword(
    accessToken: string,
    request: { new_password: string }
  ): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/change-admin-password", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  // 🔐 Envoi d'OTP pour connexion sécurisée (FONCTIONNALITÉ TEMPORAIREMENT DÉSACTIVÉE)
  async sendOtp(request: SendOtpRequest): Promise<PartnerAuthResponse> {
    console.log("⚠️ Fonctionnalité OTP temporairement désactivée");
    return {
      success: false,
      message: "Fonctionnalité OTP temporairement désactivée",
    };
  }

  // ✅ Vérification d'OTP (FONCTIONNALITÉ TEMPORAIREMENT DÉSACTIVÉE)
  async verifyOtp(request: VerifyOtpRequest): Promise<PartnerAuthResponse> {
    console.log("⚠️ Fonctionnalité OTP temporairement désactivée");
    return {
      success: false,
      message: "Fonctionnalité OTP temporairement désactivée",
    };
  }

  // 🔐 Changement de mot de passe sécurisé
  async changePassword(
    accessToken: string,
    request: ChangePasswordRequest
  ): Promise<PartnerAuthResponse> {
    return this.makeRequest<PartnerAuthResponse>("/change-password", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  // ✅ Approuver une demande d'avance sur salaire
  async approveRequest(
    accessToken: string,
    request: ApprovalRequest
  ): Promise<ApprovalResponse> {
    const url = PARTNER_APPROVAL_URL;

    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erreur ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
      throw error instanceof Error ? error : new Error("Erreur de connexion");
    }
  }

  // ❌ Rejeter une demande d'avance sur salaire
  async rejectRequest(
    accessToken: string,
    request: ApprovalRequest
  ): Promise<ApprovalResponse> {
    const url = PARTNER_APPROVAL_URL;

    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erreur ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      throw error instanceof Error ? error : new Error("Erreur de connexion");
    }
  }

  // ❌ Rejeter une inscription d'employé
  async rejectEmployeeRegistration(
    accessToken: string,
    request: { employee_id: string; reason?: string }
  ): Promise<PartnerAuthResponse> {
    const url = `${SUPABASE_URL}/functions/v1/partner-employees/reject`;

    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erreur ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("Erreur lors du rejet de l'inscription:", error);
      throw error instanceof Error ? error : new Error("Erreur de connexion");
    }
  }

  // 💰 PARTNER REIMBURSEMENTS - Méthodes pour les remboursements
  async getPartnerRemboursements(filters: any = {}): Promise<any> {
    return this.makeRequest<any>("/", {
      method: "GET",
    }, false, false, true, filters);
  }

  async getPartnerRemboursementById(id: string): Promise<any> {
    return this.makeRequest<any>(`/${id}`, {
      method: "GET",
    }, false, false, true);
  }

  async updatePartnerRemboursement(id: string, data: any): Promise<any> {
    return this.makeRequest<any>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, false, false, true);
  }

  async getPartnerRemboursementsStatistics(filters: any = {}): Promise<any> {
    return this.makeRequest<any>("/statistics", {
      method: "GET",
    }, false, false, true, filters);
  }

  async getPartnerRemboursementsEmployees(): Promise<any> {
    return this.makeRequest<any>("/employees", {
      method: "GET",
    }, false, false, true);
  }

  async getPartnerRemboursementsActivityPeriods(): Promise<any> {
    return this.makeRequest<any>("/activity-periods", {
      method: "GET",
    }, false, false, true);
  }

  async getPartnerRemboursementsEcheances(remboursementId: string): Promise<any> {
    return this.makeRequest<any>("/echeances", {
      method: "GET",
    }, false, false, true, { remboursement_id: remboursementId });
  }
}

// Instance singleton
export const edgeFunctionService = new EdgeFunctionService();

// Types pour la compatibilité avec l'ancien système
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
  activity_domain: string;
  email: string;
  phone: string;
  address: string;
  logo_url?: string;
  employees_count: number;
  active_employees_count: number;
  total_salary: number;
  avg_salary: number;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  admin: AdminUser;
  partner: Partner;
  access_token: string;
  refresh_token: string;
}
