# Migration vers la table Remboursements

## 📊 Structure de la table `remboursements` existante

```sql
CREATE TABLE public.remboursements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL UNIQUE,
  demande_avance_id uuid NOT NULL,
  employe_id uuid NOT NULL,
  partenaire_id uuid NOT NULL,
  montant_transaction numeric NOT NULL CHECK (montant_transaction > 0::numeric),
  frais_service numeric DEFAULT 0,
  montant_total_remboursement numeric NOT NULL,
  methode_remboursement USER-DEFINED NOT NULL,
  date_creation timestamp with time zone DEFAULT now(),
  date_transaction_effectuee timestamp with time zone NOT NULL,
  date_limite_remboursement timestamp with time zone NOT NULL,
  date_remboursement_effectue timestamp with time zone,
  statut USER-DEFINED DEFAULT 'EN_ATTENTE'::remboursement_statut,
  numero_compte character varying,
  numero_reception character varying,
  reference_paiement character varying,
  commentaire_partenaire text,
  commentaire_admin text,
  motif_retard text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pay_id character varying
);
```

## 🔄 Plan de migration

### Étape 1 : Mettre à jour les interfaces TypeScript

### Étape 2 : Adapter les services

### Étape 3 : Mettre à jour les pages

### Étape 4 : Adapter les API et webhooks

### Étape 5 : Tester et valider

## 📋 Fichiers à modifier

1. `lib/services.ts` - Service des transactions financières
2. `app/dashboard/page.tsx` - Dashboard principal
3. `app/dashboard/finances/page.tsx` - Page finances
4. `app/dashboard/remboursements/page.tsx` - Page remboursements
5. `app/api/djomy-webhook/route.ts` - Webhook de paiement
6. `lib/edgeFunctionService.ts` - Service Edge Function
