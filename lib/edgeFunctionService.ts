// Service pour interagir avec les Edge Functions Supabase
// Edge Function: partner-auth

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-auth`;

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

class EdgeFunctionService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${EDGE_FUNCTION_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

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
  async getPartnerInfo(accessToken: string): Promise<PartnerAuthResponse> {
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
  async getStatistics(accessToken: string): Promise<PartnerAuthResponse> {
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
  async getDemandes(accessToken: string): Promise<PartnerAuthResponse> {
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
