import type { Avis, FinancialTransaction, Message } from "./supabase";
import { supabase } from "./supabase";

// Service financier corrigé
export const financialServiceFixed = {
  async getTransactions(partnerId?: string) {
    let query = supabase
      .from("financial_transactions")
      .select("*")
      .order("date_transaction", { ascending: false });

    if (partnerId) {
      query = query.eq("partenaire_id", partnerId);
    }

    const { data, error } = await query;
    return { data: data as FinancialTransaction[], error };
  },

  async getFinancialStats(partnerId?: string) {
    const { data, error } = await this.getTransactions(partnerId);

    if (error || !data) {
      return { data: null, error };
    }

    const stats = {
      total_debloque: data
        .filter((t) => t.type === "debloque" && t.statut === "Validé")
        .reduce((sum, t) => sum + t.montant, 0),
      total_recupere: data
        .filter((t) => t.type === "recupere" && t.statut === "Validé")
        .reduce((sum, t) => sum + t.montant, 0),
      total_commissions: data
        .filter((t) => t.type === "commission" && t.statut === "Validé")
        .reduce((sum, t) => sum + t.montant, 0),
      total_transactions: data.length,
      montant_moyen:
        data.length > 0
          ? data.reduce((sum, t) => sum + t.montant, 0) / data.length
          : 0,
    };

    return { data: stats, error: null };
  },
};

// Service des messages corrigé
export const messageServiceFixed = {
  async getMessages(partnerId?: string) {
    if (!partnerId) {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("date_envoi", { ascending: false });
      return { data: data as Message[], error };
    }

    // Récupérer le nom du partenaire
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("company_name")
      .eq("id", partnerId)
      .single();

    if (partnerError || !partner) {
      return { data: [], error: partnerError };
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("destinataire", partner.company_name)
      .order("date_envoi", { ascending: false });

    return { data: data as Message[], error };
  },
};

// Service des avis corrigé
export const avisServiceFixed = {
  async getAvis(partnerId: string) {
    const { data, error } = await supabase
      .from("avis")
      .select(
        `
        *,
        employees (
          id,
          nom,
          prenom,
          email,
          poste
        )
      `
      )
      .eq("partner_id", partnerId)
      .eq("approuve", true)
      .order("created_at", { ascending: false });

    return { data: data as Avis[], error };
  },
};
