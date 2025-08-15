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
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Erreur Edge Function ${endpoint}:`, error);
      throw error;
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
