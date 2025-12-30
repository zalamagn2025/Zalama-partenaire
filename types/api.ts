import { z } from 'zod';

/**
 * Types et schémas Zod pour l'API ZaLaMa
 */

// ==================== Authentification ====================

export const LoginRequestSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  accessToken: z.string().optional(), // Support camelCase
  refreshToken: z.string().optional(), // Support camelCase
  access_token: z.string().optional(), // Support snake_case (API retourne ça)
  refresh_token: z.string().optional(), // Support snake_case (API retourne ça)
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    display_name: z.string().optional(),
    roles: z.array(z.string()),
    partenaireId: z.string().nullable().optional(),
    employeeId: z.string().nullable().optional(),
    active: z.boolean(),
    require_password_change: z.boolean().optional(),
  }),
  partner_info: z.object({
    id: z.string(),
    companyName: z.string(),
    legalStatus: z.string().optional(),
    activityDomain: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    headquartersAddress: z.string().optional(),
    employeesCountMin: z.number().optional(),
    employeesCountMax: z.number().optional(),
    status: z.string(),
    logoUrl: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  employee_info: z.object({
    id: z.string(),
    nom: z.string(),
    prenom: z.string(),
    email: z.string(),
    telephone: z.string().optional(),
    partenaireId: z.string(),
    poste: z.string().optional(),
    matricule: z.string().optional(),
    photoUrl: z.string().nullable().optional(),
    typeContrat: z.string().optional(),
    salaireNet: z.number().optional(),
    dateEmbauche: z.string().optional(),
    actif: z.boolean().optional(),
  }).optional(),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const RefreshTokenResponseSchema = z.object({
  success: z.boolean(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

export const ChangePasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const UserProfileResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    display_name: z.string().optional(),
    roles: z.array(z.string()),
    partenaireId: z.string().nullable().optional(),
    employeeId: z.string().nullable().optional(),
    active: z.boolean(),
  }),
  partner_info: z.object({
    id: z.string(),
    companyName: z.string(),
    legalStatus: z.string().optional(),
    activityDomain: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    headquartersAddress: z.string().optional(),
    employeesCountMin: z.number().optional(),
    employeesCountMax: z.number().optional(),
    status: z.string(),
    logoUrl: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  employee_info: z.object({
    id: z.string(),
    nom: z.string(),
    prenom: z.string(),
    email: z.string(),
    telephone: z.string().optional(),
    partenaireId: z.string(),
    poste: z.string().optional(),
    matricule: z.string().optional(),
    photoUrl: z.string().nullable().optional(),
    typeContrat: z.string().optional(),
    salaireNet: z.number().optional(),
    dateEmbauche: z.string().optional(),
    actif: z.boolean().optional(),
  }).optional(),
});

// ==================== Types TypeScript ====================

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

export type User = LoginResponse['user'];
export type PartnerInfo = NonNullable<LoginResponse['partner_info']>;
export type EmployeeInfo = NonNullable<LoginResponse['employee_info']>;

// ==================== Réponses génériques ====================

export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
});

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;

// ==================== Routes Partenaire ====================

// Authentification Partenaire
export const PartnerLoginRequestSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const PartnerLoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    display_name: z.string().optional(),
    role: z.string(), // L'API retourne "role" (singulier) et non "roles"
    partenaireId: z.string(),
    active: z.boolean(),
    require_password_change: z.boolean(),
  }),
  partner_info: z.object({
    id: z.string(),
    companyName: z.string(),
    legalStatus: z.string(),
    activityDomain: z.string(),
    email: z.string(),
    phone: z.string(),
    headquartersAddress: z.string(),
    employeesCountMin: z.number().nullable(),
    employeesCountMax: z.number().nullable(),
    status: z.string(),
    logoUrl: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const PartnerGetMeResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    display_name: z.string().optional(),
    role: z.string().optional(), // L'API peut retourner "role" (singulier)
    roles: z.array(z.string()).optional(), // Ou "roles" (pluriel)
    partenaireId: z.string(),
    active: z.boolean(),
    require_password_change: z.boolean(),
  }),
  partner_info: z.object({
    id: z.string(),
    companyName: z.string(),
    legalStatus: z.string(),
    activityDomain: z.string(),
    email: z.string(),
    phone: z.string(),
    headquartersAddress: z.string(),
    employeesCountMin: z.number().nullable(),
    employeesCountMax: z.number().nullable(),
    status: z.string(),
    logoUrl: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const ApiKeyResponseSchema = z.object({
  success: z.boolean(),
  api_key: z.string(),
});

export type PartnerLoginRequest = z.infer<typeof PartnerLoginRequestSchema>;
export type PartnerLoginResponse = z.infer<typeof PartnerLoginResponseSchema>;
export type PartnerGetMeResponse = z.infer<typeof PartnerGetMeResponseSchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

// Dashboard Partenaire - Réponse complète de /partner-dashboard/data
export const PartnerDashboardDataResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    statistics: z.object({
      total_employees: z.number(),
      active_employees: z.number(),
      total_demandes: z.number(),
      demandes_per_employee: z.string(),
      average_rating: z.string(),
      pending_demandes: z.number().optional(),
      total_alerts: z.number().optional(),
      active_alerts: z.number().optional(),
      total_avis: z.number().optional(),
      total_salary: z.number().optional(),
      flux_finance: z.number().optional(),
      a_rembourser_mois: z.number().optional(),
    }),
    financial_performance: z.object({
      debloque_mois: z.number(),
      a_rembourser_mois: z.number(),
      taux_remboursement: z.string(),
      date_limite_remboursement: z.string(),
      jours_restants: z.union([z.string(), z.number()]),
      employes_approuves_periode: z.number().optional(),
      dernier_paiement: z.string().optional(),
      prochain_paiement: z.string().optional(),
      payment_day: z.number().optional(),
      total_paiements_salaires: z.number().optional(),
      paiements_effectues: z.number().optional(),
      montant_total_salaires_payes: z.number().optional(),
      delai_remboursement_salaires: z.string().optional(),
      jours_restants_remboursement_salaires: z.number().optional(),
      dernier_paiement_salaire: z.string().nullable().optional(),
    }),
    charts: z.object({
      demandes_evolution: z.array(z.object({
        mois: z.string(),
        demandes: z.number(),
      })),
      montants_evolution: z.array(z.object({
        mois: z.string(),
        montant: z.number(),
      })),
      repartition_motifs: z.array(z.object({
        motif: z.string(),
        valeur: z.number(),
        color: z.string().optional(),
      })),
    }),
    partner_info: z.object({
      id: z.string(),
      company_name: z.string(),
      legal_status: z.string().optional(),
      rccm: z.string().optional(),
      nif: z.string().optional(),
      activity_domain: z.string(),
      headquarters_address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string(),
      employees_count: z.number().optional(),
      payroll: z.string().optional(),
      cdi_count: z.number().optional(),
      cdd_count: z.number().optional(),
      payment_date: z.string().nullable().optional(),
      rep_full_name: z.string().nullable().optional(),
      rep_position: z.string().nullable().optional(),
      rep_email: z.string().nullable().optional(),
      rep_phone: z.string().nullable().optional(),
      hr_full_name: z.string().nullable().optional(),
      hr_email: z.string().nullable().optional(),
      hr_phone: z.string().nullable().optional(),
      agreement: z.boolean().optional(),
      status: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      motivation_letter_url: z.string().nullable().optional(),
      motivation_letter_text: z.string().nullable().optional(),
      payment_day: z.number().optional(),
      logo_url: z.string().nullable().optional(),
      api_key: z.string().optional(),
      inscription_enabled: z.boolean().optional(),
    }),
    payment_salary_stats: z.object({
      total_paiements: z.number(),
      paiements_effectues: z.number(),
      paiements_en_attente: z.number(),
      montant_total_salaires: z.number(),
      montant_total_avances_deduites: z.number(),
      montant_total_salaires_recus: z.number(),
      montant_total_frais: z.number(),
      montant_total_remboursements: z.number(),
      semaines_retard: z.number(),
      penalite_retard_pourcentage: z.number(),
      montant_penalite_retard: z.number(),
      montant_total_avec_penalite: z.number(),
      paiements_par_mois: z.record(z.any()).optional(),
      dernier_paiement: z.string().nullable().optional(),
      dernier_paiement_paye: z.string().nullable().optional(),
      delai_remboursement: z.string(),
      jours_restants_remboursement: z.number(),
      employes_payes_distincts: z.number(),
    }).optional(),
    filters: z.object({
      month: z.number().optional(),
      year: z.number().optional(),
      payment_day: z.number().optional(),
      applied: z.boolean().optional(),
      period_start: z.string().optional(),
      period_end: z.string().optional(),
      period_description: z.string().optional(),
    }),
    remboursements: z.array(z.any()),
    alerts: z.array(z.any()),
    avis: z.array(z.any()),
    demandes: z.array(z.any()),
  }),
});

export type PartnerDashboardDataResponse = z.infer<typeof PartnerDashboardDataResponseSchema>;
export type PartnerDashboardData = PartnerDashboardDataResponse['data'];

// Employés Partenaire
export const PartnerEmployeeSchema = z.object({
  id: z.string(),
  nom: z.string(),
  prenom: z.string(),
  email: z.string().optional(),
  telephone: z.string().optional(),
  poste: z.string().optional(),
  typeContrat: z.string().optional(),
  salaireNet: z.number().optional(),
  dateEmbauche: z.string().optional(),
  actif: z.boolean().optional(),
  photoUrl: z.string().nullable().optional(),
  matricule: z.string().optional(),
});

export const PartnerEmployeesResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(PartnerEmployeeSchema).optional(),
  employees: z.array(PartnerEmployeeSchema).optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const PartnerEmployeeStatsSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    total: z.number().optional(),
    actifs: z.number().optional(),
    inactifs: z.number().optional(),
    par_type_contrat: z.record(z.number()).optional(),
    salaire_moyen: z.number().optional(),
  }).optional(),
});

export type PartnerEmployee = z.infer<typeof PartnerEmployeeSchema>;
export type PartnerEmployeesResponse = z.infer<typeof PartnerEmployeesResponseSchema>;
export type PartnerEmployeeStats = z.infer<typeof PartnerEmployeeStatsSchema>;

// Avis Employés
export const PartnerEmployeeAvisSchema = z.object({
  id: z.string(),
  note: z.number(),
  commentaire: z.string().optional(),
  date_avis: z.string(),
  approuve: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  employee_id: z.string(),
  partner_id: z.string(),
  type_retour: z.string().optional(),
  employee: PartnerEmployeeSchema.optional(),
});

export const PartnerEmployeeAvisResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(PartnerEmployeeAvisSchema).optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type PartnerEmployeeAvis = z.infer<typeof PartnerEmployeeAvisSchema>;
export type PartnerEmployeeAvisResponse = z.infer<typeof PartnerEmployeeAvisResponseSchema>;

// Demandes d'adhésion
export const PartnerDemandeAdhesionSchema = z.object({
  id: z.string(),
  nom: z.string(),
  prenom: z.string(),
  email: z.string().nullable(),
  telephone: z.string().nullable(),
  adresse: z.string().nullable(),
  partenaireId: z.string(),
  salaireNet: z.number().nullable(),
  poste: z.string(),
  matricule: z.string().nullable(),
  photoUrl: z.string().nullable().optional(),
  typeContrat: z.string(),
  status: z.string().optional(), // 'pending', 'approved', 'rejected'
  rejectionReason: z.string().nullable().optional(),
  approvalComment: z.string().nullable().optional(),
  employeeCreated: z.boolean().optional(),
  approvedBy: z.string().nullable().optional(),
  rejectedBy: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PartnerDemandeAdhesionResponseSchema = z.object({
  data: z.array(PartnerDemandeAdhesionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number().optional(),
});

export const PartnerDemandeAdhesionStatsSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    total: z.number().optional(),
    pending: z.number().optional(),
    approved: z.number().optional(),
    rejected: z.number().optional(),
  }).optional(),
});

export type PartnerDemandeAdhesion = z.infer<typeof PartnerDemandeAdhesionSchema>;
export type PartnerDemandeAdhesionResponse = z.infer<typeof PartnerDemandeAdhesionResponseSchema>;
export type PartnerDemandeAdhesionStats = z.infer<typeof PartnerDemandeAdhesionStatsSchema>;

// Finances Partenaire
export const PartnerFinancesDemandesResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(z.any()).optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const PartnerFinancesRemboursementsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(z.any()).optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const PartnerFinancesStatsSchema = z.object({
  success: z.boolean(),
  data: z.object({
    demandes: z.object({
      total: z.number(),
      montantTotal: z.number(),
    }).optional(),
    remboursements: z.object({
      total: z.number(),
      montantTotal: z.number(),
    }).optional(),
    total_demandes: z.number().optional(),
    total_remboursements: z.number().optional(),
    solde: z.number().optional(),
  }),
});

export const PartnerFinancesEvolutionMensuelleSchema = z.object({
  success: z.boolean(),
  data: z.object({
    repartition_par_mois: z.array(z.object({
      mois: z.number(),
      annee: z.number(),
      total_demandes: z.number(),
      total_remboursements: z.number(),
      solde: z.number(),
    })),
  }),
});

export const PartnerFinancesEmployeeStatsSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total_paiements: z.number(),
    paiements_effectues: z.number(),
    paiements_en_attente: z.number(),
    montant_total_salaires: z.number(),
    montant_total_avances_deduites: z.number(),
    montant_total_salaires_recus: z.number(),
    montant_total_frais: z.number(),
    montant_total_remboursements: z.number(),
    semaines_retard: z.number(),
    penalite_retard_pourcentage: z.number(),
    montant_penalite_retard: z.number(),
    montant_total_avec_penalite: z.number(),
    paiements_par_mois: z.record(z.any()).optional(),
    dernier_paiement: z.string().optional(),
    dernier_paiement_paye: z.string().optional(),
    delai_remboursement: z.string().optional(),
    jours_restants_remboursement: z.number().nullable(),
    employes_payes_distincts: z.number(),
  }),
});

export type PartnerFinancesDemandesResponse = z.infer<typeof PartnerFinancesDemandesResponseSchema>;
export type PartnerFinancesRemboursementsResponse = z.infer<typeof PartnerFinancesRemboursementsResponseSchema>;
export type PartnerFinancesStats = z.infer<typeof PartnerFinancesStatsSchema>;
export type PartnerFinancesEvolutionMensuelle = z.infer<typeof PartnerFinancesEvolutionMensuelleSchema>;
export type PartnerFinancesEmployeeStats = z.infer<typeof PartnerFinancesEmployeeStatsSchema>;

// Informations Partenaire
export const PartnerInfoResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    companyName: z.string(),
    legalStatus: z.string(),
    activityDomain: z.string(),
    email: z.string(),
    phone: z.string(),
    headquartersAddress: z.string(),
    employeesCount: z.number().optional(),
    employeesCountMin: z.number().nullable().optional(),
    employeesCountMax: z.number().nullable().optional(),
    activeEmployeesCount: z.number().optional(),
    totalSalary: z.number().optional(),
    avgSalary: z.number().optional(),
    status: z.string(),
    logoUrl: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type PartnerInfoResponse = z.infer<typeof PartnerInfoResponseSchema>;

// ==================== Treasury Advances (Avances de Trésorerie) ====================

export const TreasuryAdvanceStatusSchema = z.enum([
  'REQUESTED',
  'WAITING_ADMIN_VALIDATION',
  'APPROVED',
  'REJECTED',
  'RELEASED',
  'REPAYMENT_PENDING',
  'OVERDUE',
  'PENALTY_APPLIED',
  'REPAID',
]);

export const TreasuryAdvanceSchema = z.object({
  id: z.string(),
  partenaireId: z.string(),
  partenaire: z.object({
    id: z.string(),
    companyName: z.string(),
    legalStatus: z.string(),
    rccm: z.string().nullable(),
    rccmDocumentUrl: z.string().nullable(),
    nif: z.string().nullable(),
    nifDocumentUrl: z.string().nullable(),
    activityDomain: z.string(),
    headquartersAddress: z.string(),
    phone: z.string(),
    email: z.string(),
    paymentDay: z.number().nullable(),
    payroll: z.string().nullable(),
    lastPaymentDocumentUrl: z.string().nullable(),
    employeesCountMin: z.number().nullable(),
    employeesCountMax: z.number().nullable(),
    contactRequestId: z.string().nullable(),
    status: z.string(),
    agreement: z.boolean(),
    motivationLetterUrl: z.string().nullable(),
    logoUrl: z.string().nullable(),
    apiKey: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  approbateurId: z.string().nullable(),
  approbateur: z.any().nullable(),
  montantDemande: z.number(),
  montantTotal: z.number(),
  fraisTresorerie: z.number(),
  montantRembourse: z.number(),
  penalitesAccumulees: z.number(),
  montantTotalRemboursement: z.number(),
  statut: TreasuryAdvanceStatusSchema,
  dateDemande: z.string(),
  dateApprobation: z.string().nullable(),
  dateDeblocage: z.string().nullable(),
  dateLimiteRemboursement: z.string().nullable(),
  dateRemboursement: z.string().nullable(),
  dateDernierePenalite: z.string().nullable(),
  dureeSemaines: z.number(),
  rejetMotif: z.string().nullable(),
  reference: z.string().nullable(),
  commentaire: z.string().nullable(),
  numeroCompteRemboursement: z.string().nullable(),
  methodeRemboursement: z.string().nullable(),
  employeIds: z.string(), // JSON string array
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TreasuryAdvancesListResponseSchema = z.object({
  data: z.array(TreasuryAdvanceSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const TreasuryAdvanceDetailResponseSchema = z.object({
  success: z.boolean().optional(),
  data: TreasuryAdvanceSchema.optional(),
});

export const TreasuryAdvanceRequestSchema = z.object({
  employeIds: z.array(z.string()),
  mois: z.number().min(1).max(12),
  annee: z.number(),
  partenaireId: z.string(),
  reference: z.string().optional(),
  commentaire: z.string().optional(),
});

export const TreasuryAdvanceApproveRequestSchema = z.object({
  commentaire: z.string().optional(),
});

export const TreasuryAdvanceRejectRequestSchema = z.object({
  motif: z.string(),
});

export const TreasuryAdvanceRepayRequestSchema = z.object({
  montant: z.number().min(0),
  methodeRemboursement: z.enum(['WALLET', 'EXTERNAL']),
  numeroCompteRemboursement: z.string().optional(),
  reference: z.string().optional(),
  commentaire: z.string().optional(),
});

export const TreasuryAdvanceResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: TreasuryAdvanceSchema.optional(),
});

export type TreasuryAdvanceStatus = z.infer<typeof TreasuryAdvanceStatusSchema>;
export type TreasuryAdvance = z.infer<typeof TreasuryAdvanceSchema>;
export type TreasuryAdvancesListResponse = z.infer<typeof TreasuryAdvancesListResponseSchema>;
export type TreasuryAdvanceDetailResponse = z.infer<typeof TreasuryAdvanceDetailResponseSchema>;
export type TreasuryAdvanceRequest = z.infer<typeof TreasuryAdvanceRequestSchema>;
export type TreasuryAdvanceApproveRequest = z.infer<typeof TreasuryAdvanceApproveRequestSchema>;
export type TreasuryAdvanceRejectRequest = z.infer<typeof TreasuryAdvanceRejectRequestSchema>;
export type TreasuryAdvanceRepayRequest = z.infer<typeof TreasuryAdvanceRepayRequestSchema>;
export type TreasuryAdvanceResponse = z.infer<typeof TreasuryAdvanceResponseSchema>;

