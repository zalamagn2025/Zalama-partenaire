// Service pour l'API Djomy
// Documentation: https://djomy.com/api

import CryptoJS from "crypto-js";

// Types pour l'API Djomy
export interface DjomyPaymentRequest {
  paymentMethod:
    | "MOMO"
    | "YMO"
    | "OM"
    | "PAYCARD"
    | "KULU"
    | "SOUTOURA"
    | "VISA"
    | "MC"
    | "AMEX";
  payerIdentifier: string;
  amount: number;
  countryCode: string;
  description?: string;
  merchantPaymentReference?: string;
}

export interface DjomyPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: string;
    paymentUrl?: string;
  };
  error?: any;
}

export interface DjomyPaymentStatus {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    paidAmount?: number;
    receivedAmount?: number;
    fees?: number;
    paymentMethod: string;
    merchantPaymentReference?: string;
    payerIdentifier: string;
    currency: string;
    createdAt: string;
  };
}

export interface DjomyLinkRequest {
  amountToPay?: number;
  linkName?: string;
  phoneNumber?: string;
  description?: string;
  countryCode: string;
  usageType: "UNIQUE" | "MULTIPLE";
  expiresAt?: string;
  merchantReference?: string;
  usageLimit?: number;
}

export interface DjomyLinkResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    paymentUrl: string;
    status: string;
  };
}

export interface DjomyAuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    expiresIn: number;
  };
  error?: any;
}

class DjomyService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_DJOMY_API_BASE_URL ||
      "https://sandbox-api.djomy.africa";
    this.clientId = process.env.NEXT_PUBLIC_DJOMY_CLIENT_ID || "";
    this.clientSecret = process.env.NEXT_PUBLIC_DJOMY_CLIENT_SECRET || "";
  }

  // Génération de la signature HMAC selon la documentation Djomy
  private generateHmacSignature(
    clientId: string,
    clientSecret: string
  ): string {
    try {
      const hash = CryptoJS.HmacSHA256(clientId, clientSecret);
      return hash.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error("Erreur de génération HMAC:", error);
      throw new Error("Erreur lors de la génération de la signature HMAC");
    }
  }

  // Obtenir un token d'authentification
  async getAuthToken(): Promise<string> {
    try {
      const signature = this.generateHmacSignature(
        this.clientId,
        this.clientSecret
      );
      const apiKey = `${this.clientId}:${signature}`;

      const response = await fetch(`${this.baseUrl}/v1/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: DjomyAuthResponse = await response.json();

      if (!data.success || !data.data?.accessToken) {
        throw new Error(data.message || "Erreur d'authentification");
      }

      return data.data.accessToken;
    } catch (error) {
      console.error("Erreur lors de l'authentification Djomy:", error);
      throw error;
    }
  }

  // Initier un paiement
  async initiatePayment(
    paymentData: DjomyPaymentRequest
  ): Promise<DjomyPaymentResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: DjomyPaymentResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de l'initiation du paiement:", error);
      throw error;
    }
  }

  // Vérifier le statut d'un paiement
  async checkPaymentStatus(transactionId: string): Promise<DjomyPaymentStatus> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.baseUrl}/v1/payments/${transactionId}/status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: DjomyPaymentStatus = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
      throw error;
    }
  }

  // Créer un lien de paiement
  async createPaymentLink(
    linkData: DjomyLinkRequest
  ): Promise<DjomyLinkResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/v1/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: DjomyLinkResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la création du lien:", error);
      throw error;
    }
  }

  // Récupérer un lien de paiement
  async getPaymentLink(reference: string): Promise<DjomyLinkResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/v1/links/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: DjomyLinkResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération du lien:", error);
      throw error;
    }
  }

  // Lister tous les liens de paiement
  async listPaymentLinks(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.size) queryParams.append("size", params.size.toString());

      const response = await fetch(`${this.baseUrl}/v1/links?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des liens:", error);
      throw error;
    }
  }

  // Fonction utilitaire pour formater les montants
  formatAmount(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "GNF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Fonction utilitaire pour valider un numéro de téléphone
  validatePhoneNumber(phone: string, countryCode: string): boolean {
    // Validation basique selon le pays
    const phoneRegex = {
      GN: /^00224[0-9]{8}$/, // Guinée: 00224 + 8 chiffres
      CI: /^00225[0-9]{8}$/, // Côte d'Ivoire: 00225 + 8 chiffres
      SN: /^00221[0-9]{8}$/, // Sénégal: 00221 + 8 chiffres
    };

    const regex = phoneRegex[countryCode as keyof typeof phoneRegex];
    return regex ? regex.test(phone) : true;
  }

  // Fonction utilitaire pour obtenir les méthodes de paiement disponibles par pays
  getAvailablePaymentMethods(countryCode: string): string[] {
    const methodsByCountry = {
      GN: ["OM", "MOMO", "KULU"], // Guinée
      CI: ["OM", "MOMO", "KULU"], // Côte d'Ivoire
      SN: ["OM", "MOMO", "KULU"], // Sénégal
    };

    return (
      methodsByCountry[countryCode as keyof typeof methodsByCountry] || [
        "OM",
        "MOMO",
      ]
    );
  }

  // Fonction pour créer un paiement de remboursement
  async createRemboursementPayment(remboursementData: {
    employeePhone: string;
    amount: number;
    employeeName: string;
    remboursementId: string;
    countryCode?: string;
  }): Promise<DjomyPaymentResponse> {
    const paymentData: DjomyPaymentRequest = {
      paymentMethod: "OM", // Par défaut Orange Money
      payerIdentifier: remboursementData.employeePhone,
      amount: remboursementData.amount,
      countryCode: remboursementData.countryCode || "GN",
      description: `Remboursement avance salariale - ${remboursementData.employeeName}`,
      merchantPaymentReference: `REMBOURSEMENT-${remboursementData.remboursementId}`,
    };

    return this.initiatePayment(paymentData);
  }

  // Fonction pour créer un lien de paiement pour remboursement
  async createRemboursementLink(remboursementData: {
    amount: number;
    employeeName: string;
    remboursementId: string;
    employeePhone?: string;
    countryCode?: string;
  }): Promise<DjomyLinkResponse> {
    const linkData: DjomyLinkRequest = {
      amountToPay: remboursementData.amount,
      linkName: `Remboursement ${remboursementData.employeeName}`,
      phoneNumber: remboursementData.employeePhone,
      description: `Remboursement avance salariale - ${remboursementData.employeeName}`,
      countryCode: remboursementData.countryCode || "GN",
      usageType: "UNIQUE",
      merchantReference: `LINK-REMBOURSEMENT-${remboursementData.remboursementId}`,
    };

    return this.createPaymentLink(linkData);
  }
}

// Instance singleton du service
export const djomyService = new DjomyService();
