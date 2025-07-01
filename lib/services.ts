import { supabase } from './supabase'
import type { User, Partner, Employee, Service, Alert, FinancialTransaction, Message, Avis, Demande, PartnershipRequest, DemandeAvanceSalaire, DemandeP2P, SalaryAdvanceRequest } from './supabase'

// Service d'authentification
export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// Service pour les partenaires
export const partnerService = {
  async getPartners() {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('actif', true)
      .order('created_at', { ascending: false })
    return { data: data as Partner[], error }
  },

  async getPartnerById(id: string) {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single()
    return { data: data as Partner, error }
  },

  async getPartnerByEmail(email: string) {
    // Essayer d'abord avec email_representant
    let { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('email_representant', email)
      .single()
    
    if (error || !data) {
      // Si pas trouvé, essayer avec email_rh
      const { data: data2, error: error2 } = await supabase
        .from('partners')
        .select('*')
        .eq('email_rh', email)
        .single()
      
      data = data2;
      error = error2;
    }
    
    return { data: data as Partner, error }
  },

  async getPartnerByUserId(userId: string) {
    // D'abord récupérer l'utilisateur pour obtenir son organisation
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organisation')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return { data: null, error: userError };
    }
    
    // Ensuite chercher le partenaire par nom d'organisation
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('nom', user.organisation)
      .single()
    return { data: data as Partner, error }
  },

  async updatePartner(id: string, updates: Partial<Partner>) {
    const { data, error } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data: data as Partner, error }
  }
}

// Service pour les employés
export const employeeService = {
  async getEmployees(partnerId?: string) {
    let query = supabase
      .from('employees')
      .select('*')
      .order('date_embauche', { ascending: false })
    
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }
    
    const { data, error } = await query
    return { data: data as Employee[], error }
  },

  async createEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single()
    return { data: data as Employee, error }
  },

  async updateEmployee(employeeId: string, updates: Partial<Employee>) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
      .select()
      .single()
    return { data: data as Employee, error }
  },

  async deleteEmployee(id: string) {
    const { error } = await supabase
      .from('employees')
      .update({ actif: false })
      .eq('id', id)
    return { error }
  }
}

// Service pour les services
export const serviceService = {
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('disponible', true)
      .order('created_at', { ascending: false })
    return { data: data as Service[], error }
  },

  async getServiceById(id: number) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()
    return { data: data as Service, error }
  }
}

// Service pour les alertes
export const alertService = {
  async getAlerts(partnerId?: string) {
    let query = supabase
      .from('alerts')
      .select('*')
      .order('date_creation', { ascending: false })
    
      // Pour l'instant, récupérer toutes les alertes
      // car la table n'a pas de lien direct avec les partenaires
    
    const { data, error } = await query
    return { data: data as Alert[], error }
  },

  async createAlert(alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('alerts')
      .insert(alertData)
      .select()
      .single()
    return { data: data as Alert, error }
  },

  async updateAlert(alertId: string, updates: Partial<Alert>) {
    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single()
    return { data: data as Alert, error }
  }
}

// Service pour les transactions financières
export const financialService = {
  async getTransactions(partnerId?: string) {
    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        employees (
          id,
          nom,
          prenom,
          email,
          poste
        )
      `)
      .order('date_transaction', { ascending: false });

    // Filtrer par partenaire si spécifié
    if (partnerId) {
      query = query.eq('partenaire_id', partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  async getFinancialStats(partnerId?: string) {
    let query = supabase
      .from('financial_transactions')
      .select('montant, type, statut');

    // Filtrer par partenaire si spécifié
    if (partnerId) {
      query = query.eq('partenaire_id', partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { data: null, error };
    }

    // Calculer les statistiques
    const stats = {
      total_debloque: 0,
      total_recupere: 0,
      total_revenus: 0,
      total_remboursements: 0,
      total_transactions: data?.length || 0,
      montant_moyen: 0
    };

    if (data && data.length > 0) {
      const totalMontant = data.reduce((sum, transaction) => sum + Number(transaction.montant), 0);
      stats.montant_moyen = totalMontant / data.length;

      data.forEach(transaction => {
        const montant = Number(transaction.montant);
        switch (transaction.type) {
          case 'Débloqué':
            stats.total_debloque += montant;
            break;
          case 'Récupéré':
            stats.total_recupere += montant;
            break;
          case 'Revenu':
            stats.total_revenus += montant;
            break;
          case 'Remboursement':
            stats.total_remboursements += montant;
            break;
        }
      });
    }

    return { data: stats, error: null };
  }
}

// Service pour les messages
export const messageService = {
  async getMessages(partnerId?: string) {
    let query = supabase
      .from('messages')
      .select('*')
      .order('date_envoi', { ascending: false })
    
    if (partnerId) {
      // Récupérer les messages des employés du partenaire
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, email')
        .eq('partner_id', partnerId)
        .eq('actif', true)
      
      if (employees && employees.length > 0) {
        // Récupérer les utilisateurs correspondant aux employés
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .in('email', employees.map(emp => emp.email).filter(Boolean))
        
        if (users && users.length > 0) {
          const userIds = users.map(user => user.id);
          // Récupérer les messages où l'utilisateur est expéditeur ou destinataire
          query = query.or(`expediteur_id.in.(${userIds.join(',')}),destinataire_id.in.(${userIds.join(',')})`);
        } else {
          // Si pas d'utilisateurs trouvés, retourner un tableau vide
          return { data: [], error: null };
        }
      } else {
        // Si pas d'employés trouvés, retourner un tableau vide
        return { data: [], error: null };
      }
    }
    
    const { data, error } = await query
    return { data: data as Message[], error }
  },

  async markAsRead(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ lu: true, date_lecture: new Date().toISOString() })
      .eq('id', messageId)
    return { data, error }
  },

  async sendReply(replyData: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert(replyData)
    return { data, error }
  }
}

// Service pour les avis
export const avisService = {
  async getAvis(partnerId: string) {
    const { data, error } = await supabase
      .from('avis')
      .select(`
        *,
        users (
          id,
          nom,
          prenom,
          email,
          type
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  async createAvis(avis: Partial<Avis>) {
    const { data, error } = await supabase
      .from('avis')
      .insert(avis)
      .select()
      .single();

    return { data, error };
  },

  async updateAvis(id: string, updates: Partial<Avis>) {
    const { data, error } = await supabase
      .from('avis')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async deleteAvis(id: string) {
    const { error } = await supabase
      .from('avis')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// Service pour les demandes
export const demandeService = {
  async getDemandes(partnerId?: string) {
    let query = supabase
      .from('demandes')
      .select('*')
      .order('date_demande', { ascending: false })
    
    if (partnerId) {
      // Récupérer les demandes des employés du partenaire
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, email')
        .eq('partner_id', partnerId)
        .eq('actif', true)
      
      if (employees && employees.length > 0) {
        // Récupérer les utilisateurs correspondant aux employés
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .in('email', employees.map(emp => emp.email).filter(Boolean))
        
        if (users && users.length > 0) {
          const userIds = users.map(user => user.id);
          query = query.in('user_id', userIds);
        } else {
          // Si pas d'utilisateurs trouvés, retourner un tableau vide
          return { data: [], error: null };
        }
      } else {
        // Si pas d'employés trouvés, retourner un tableau vide
        return { data: [], error: null };
      }
    }
    
    const { data, error } = await query
    return { data: data as Demande[], error }
  },

  async createDemande(demandeData: Omit<Demande, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('demandes')
      .insert(demandeData)
      .select()
      .single()
    return { data: data as Demande, error }
  },

  async updateDemande(demandeId: string, updates: Partial<Demande>) {
    const { data, error } = await supabase
      .from('demandes')
      .update(updates)
      .eq('id', demandeId)
      .select()
      .single()
    return { data: data as Demande, error }
  }
}

// Service pour les demandes de partenariat
export const partnershipRequestService = {
  async getPendingRequests() {
    const { data, error } = await supabase
      .from('partnership_requests')
      .select('*')
      .eq('statut', 'En attente')
      .order('date_soumission', { ascending: false })
    return { data: data as PartnershipRequest[], error }
  },

  async validateRequest(requestId: string, type: string, secteur: string) {
    const { data, error } = await supabase
      .rpc('validate_partnership_request', {
        p_request_id: requestId,
        p_type: type,
        p_secteur: secteur
      })
    return { data, error }
  }
}

// Service pour les statistiques du dashboard
export const dashboardService = {
  async getDashboardStats() {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats')
    return { data, error }
  },

  async getPartnerStatistics() {
    const { data, error } = await supabase
      .from('partner_statistics')
      .select('*')
    return { data, error }
  },

  async getFinancialPerformance() {
    const { data, error } = await supabase
      .from('financial_performance')
      .select('*')
      .single()
    return { data, error }
  }
}

// Service pour les demandes d'avance sur salaire
export const demandeAvanceService = {
  async getDemandes(partnerId: string) {
    // Alias pour getDemandesAvance pour maintenir la compatibilité
    return this.getDemandesAvance(partnerId);
  },

  async getDemandesAvance(partnerId: string) {
    const { data, error } = await supabase
      .from('salary_advance_requests')
      .select(`
        *,
        employees (
          id,
          nom,
          prenom,
          email,
          poste
        )
      `)
      .eq('partenaire_id', partnerId)
      .order('date_creation', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des demandes d\'avance:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  async createDemandeAvance(demande: Partial<SalaryAdvanceRequest>) {
    const { data, error } = await supabase
      .from('salary_advance_requests')
      .insert(demande)
      .select()
      .single();

    return { data, error };
  },

  async updateDemandeAvance(id: string, updates: Partial<SalaryAdvanceRequest>) {
    const { data, error } = await supabase
      .from('salary_advance_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async deleteDemandeAvance(id: string) {
    const { error } = await supabase
      .from('salary_advance_requests')
      .delete()
      .eq('id', id);

    return { error };
  }
}; 