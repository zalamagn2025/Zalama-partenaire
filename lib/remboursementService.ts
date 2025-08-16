import { supabase } from "./supabase";
import type { Remboursement, RemboursementWithEmployee } from "./supabase";

// Service pour les remboursements (remplace financialService)
export const remboursementService = {
  async getRemboursements(partnerId?: string) {
    let query = supabase
      .from("remboursements")
      .select(
        `
        *,
        employees (
          id,
          nom,
          prenom,
          email,
          poste
        ),
        salary_advance_requests (
          id,
          montant_demande,
          motif,
          statut
        )
      `
      )
      .order("date_creation", { ascending: false });

    // Filtrer par partenaire si spécifié
    if (partnerId) {
      query = query.eq("partenaire_id", partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Erreur lors de la récupération des remboursements:",
        error
      );
      return { data: null, error };
    }

    return { data: data as RemboursementWithEmployee[], error: null };
  },

  async getRemboursementStats(partnerId?: string) {
    let query = supabase
      .from("remboursements")
      .select("montant_total_remboursement, statut, date_creation");

    // Filtrer par partenaire si spécifié
    if (partnerId) {
      query = query.eq("partenaire_id", partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return { data: null, error };
    }

    // Calculer les statistiques avancées
    const stats = this.calculateAdvancedStats((data as any[]) || []);

    return { data: stats, error: null };
  },

  // Calculer les statistiques de remboursements avancées
  calculateAdvancedStats(remboursements: any[]) {
    const stats = {
      total_remboursements: 0,
      total_paye: 0,
      total_en_attente: 0,
      total_en_retard: 0,
      total_annule: 0,
      montant_moyen: 0,
      montant_total: 0,
      remboursements_en_retard: 0,
      evolution_mensuelle: [] as any[],
      repartition_par_statut: [] as any[],
      top_employes: [] as any[],
    };

    if (remboursements.length > 0) {
      const totalMontant = remboursements.reduce(
        (sum, remb) => sum + Number(remb.montant_total_remboursement || 0),
        0
      );
      stats.montant_moyen = totalMontant / remboursements.length;
      stats.montant_total = totalMontant;

      // Calculer les totaux par statut
      remboursements.forEach((remb) => {
        const montant = Number(remb.montant_total_remboursement || 0);
        const statut = remb.statut;

        switch (statut) {
          case "PAYE":
            stats.total_paye += montant;
            break;
          case "EN_ATTENTE":
            stats.total_en_attente += montant;
            break;
          case "EN_RETARD":
            stats.total_en_retard += montant;
            stats.remboursements_en_retard++;
            break;
          case "ANNULE":
            stats.total_annule += montant;
            break;
        }
      });

      stats.total_remboursements = remboursements.length;

      // Calculer la répartition par statut
      const statutCount = remboursements.reduce((acc, remb) => {
        acc[remb.statut] = (acc[remb.statut] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      stats.repartition_par_statut = Object.entries(statutCount).map(
        ([statut, count]) => ({
          statut,
          count: count as number,
          percentage: ((count as number) / remboursements.length) * 100,
        })
      );

      // Calculer l'évolution mensuelle
      const monthlyData = remboursements.reduce((acc, remb) => {
        const date = new Date(remb.date_creation);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            total: 0,
            count: 0,
          };
        }

        acc[monthKey].total += Number(remb.montant_total_remboursement || 0);
        acc[monthKey].count += 1;

        return acc;
      }, {} as Record<string, any>);

      stats.evolution_mensuelle = Object.values(monthlyData).sort(
        (a: any, b: any) => a.month.localeCompare(b.month)
      );

      // Calculer les top employés
      const employeeStats = remboursements.reduce((acc, remb) => {
        if (remb.employe_id) {
          if (!acc[remb.employe_id]) {
            acc[remb.employe_id] = {
              employee_id: remb.employe_id,
              total: 0,
              count: 0,
            };
          }
          acc[remb.employe_id].total += Number(
            remb.montant_total_remboursement || 0
          );
          acc[remb.employe_id].count += 1;
        }
        return acc;
      }, {} as Record<string, any>);

      stats.top_employes = Object.values(employeeStats)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);
    }

    return stats;
  },

  async getRemboursementsFiltered(
    partnerId: string,
    filters: {
      statut?: string;
      dateDebut?: string;
      dateFin?: string;
      montantMin?: number;
      montantMax?: number;
    }
  ) {
    let query = supabase
      .from("remboursements")
      .select(
        `
        *,
        employees (
          id,
          nom,
          prenom,
          email,
          poste
        ),
        salary_advance_requests (
          id,
          montant_demande,
          motif,
          statut
        )
      `
      )
      .eq("partenaire_id", partnerId)
      .order("date_creation", { ascending: false });

    // Appliquer les filtres
    if (filters.statut) {
      query = query.eq("statut", filters.statut);
    }

    if (filters.dateDebut) {
      query = query.gte("date_creation", filters.dateDebut);
    }

    if (filters.dateFin) {
      query = query.lte("date_creation", filters.dateFin);
    }

    if (filters.montantMin !== undefined) {
      query = query.gte("montant_total_remboursement", filters.montantMin);
    }

    if (filters.montantMax !== undefined) {
      query = query.lte("montant_total_remboursement", filters.montantMax);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Erreur lors de la récupération des remboursements filtrés:",
        error
      );
      return { data: null, error };
    }

    return { data: data as RemboursementWithEmployee[], error: null };
  },

  // Mettre à jour le statut d'un remboursement
  async updateRemboursementStatus(
    remboursementId: string,
    newStatus: string,
    additionalData?: any
  ) {
    const updateData: any = {
      statut: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "PAYE" && !updateData.date_remboursement_effectue) {
      updateData.date_remboursement_effectue = new Date().toISOString();
    }

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    const { data, error } = await supabase
      .from("remboursements")
      .update(updateData)
      .eq("id", remboursementId)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour du remboursement:", error);
      return { data: null, error };
    }

    return { data: data as Remboursement, error: null };
  },
};
