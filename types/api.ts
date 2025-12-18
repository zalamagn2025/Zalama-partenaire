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
  accessToken: z.string(),
  refreshToken: z.string(),
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

