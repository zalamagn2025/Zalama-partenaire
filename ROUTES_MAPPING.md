# Mapping des Routes API par Page

## ✅ Routes vérifiées dans config/api.ts

Toutes les routes documentées existent dans `config/api.ts`.

## 📋 Mapping Pages → Routes API

### 1. **Tableau de bord** (`/dashboard`)
- ✅ Route utilisée: `/partner-dashboard/data` (via `usePartnerDashboardAllData`)
- ✅ Hook: `usePartnerDashboardAllData(year, month)`
- ✅ Status: **OK**

### 2. **Demandes d'Adhésion** (`/dashboard/demandes-adhesion`)
- ✅ Route utilisée: `/partner-demande-adhesion` (via `usePartnerDemandeAdhesion`)
- ✅ Hook: `usePartnerDemandeAdhesion({ search, status, limit, page })`
- ✅ Status: **OK**

### 3. **Employés** (`/dashboard/employes`)
- ✅ Route utilisée: `/partner-employee` (via `usePartnerEmployees`)
- ✅ Hook: `usePartnerEmployees({ search, typeContrat, actif, poste, sortBy, sortOrder, limit, page })`
- ✅ Status: **OK**

### 4. **Demande d'avance** (`/dashboard/demandes`)
- ❌ Route actuelle: **Données mock** (TODO)
- ✅ Route attendue: `/partner-finances/demandes` (via `usePartnerFinancesDemandes`)
- ✅ Hook disponible: `usePartnerFinancesDemandes({ offset, limit, status, annee, mois })`
- ⚠️ Status: **À CORRIGER**

### 5. **Paiement de salaire** (`/dashboard/paiements`)
- ❌ Route actuelle: **Données mock** (TODO)
- ✅ Route attendue: `/partner-finances/partner-employee-stats` (via `usePartnerFinancesEmployeeStats`)
- ✅ Hook disponible: `usePartnerFinancesEmployeeStats()`
- ⚠️ Status: **À CORRIGER**

### 6. **Remboursements** (`/dashboard/remboursements`)
- ✅ Route utilisée: `/partner-finances/remboursements` (via `usePartnerFinancesRemboursements`)
- ✅ Hook: `usePartnerFinancesRemboursements({ offset, limit, status, annee, mois })`
- ✅ Status: **OK**

### 7. **Avis des Salariés** (`/dashboard/avis`)
- ✅ Route utilisée: `/partner-employee/avis` (via `usePartnerEmployeeAvis`)
- ✅ Hook: `usePartnerEmployeeAvis({ userId, typeRetour, approuve, limit, page })`
- ✅ Status: **OK**

### 8. **Paramètres** (`/dashboard/parametres`)
- ✅ Route utilisée: `/partner-auth/api-key` (via `usePartnerApiKey`)
- ✅ Route utilisée: `/partner-auth/regenerate-api-key` (via `useRegeneratePartnerApiKey`)
- ✅ Hooks: `usePartnerApiKey()`, `useRegeneratePartnerApiKey()`
- ✅ Status: **OK**

## 🔧 Actions à effectuer

1. **Corriger `/dashboard/demandes`** pour utiliser `usePartnerFinancesDemandes`
2. **Corriger `/dashboard/paiements`** pour utiliser `usePartnerFinancesEmployeeStats`

