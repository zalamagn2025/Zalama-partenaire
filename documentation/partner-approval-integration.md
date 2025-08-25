# Intégration des Méthodes d'Approbation/Rejet des Demandes

## Vue d'ensemble

Cette documentation décrit l'intégration des méthodes `approveRequest` et `rejectRequest` dans le service Edge Function pour gérer l'approbation et le rejet des demandes d'avance sur salaire par les RH et Responsables.

## Architecture

### 1. Service Edge Function (`lib/edgeFunctionService.ts`)

#### Nouvelles interfaces ajoutées :

```typescript
export interface ApprovalRequest {
  requestId: string;
  action: "approve" | "reject";
  approverId: string;
  approverRole: "rh" | "responsable";
  reason?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    newStatus: string;
    approverRole: string;
    reason?: string;
  };
}
```

#### Nouvelles méthodes ajoutées :

```typescript
// ✅ Approuver une demande d'avance sur salaire
async approveRequest(
  accessToken: string,
  request: ApprovalRequest
): Promise<ApprovalResponse>

// ❌ Rejeter une demande d'avance sur salaire
async rejectRequest(
  accessToken: string,
  request: ApprovalRequest
): Promise<ApprovalResponse>
```

### 2. Route API (`app/api/partner-approval/route.ts`)

#### Fonctionnalités :

- **Authentification** : Vérification du token Bearer avec Supabase
- **Validation des données** : Vérification des champs requis et des valeurs
- **Gestion des statuts** : Mise à jour automatique du statut de la demande
- **Traçabilité** : Enregistrement des actions dans l'historique
- **Gestion d'erreurs** : Messages d'erreur appropriés pour chaque cas

#### Workflow de validation :

1. Vérification de l'authentification
2. Validation des données requises (`requestId`, `action`, `approverId`, `approverRole`)
3. Validation des valeurs (`action` doit être "approve" ou "reject")
4. Validation des rôles (`approverRole` doit être "rh" ou "responsable")
5. Vérification de l'existence de la demande
6. Vérification du statut de la demande ("En attente RH/Responsable")
7. Mise à jour du statut et des dates
8. Enregistrement dans l'historique (si disponible)

### 3. Page Demandes (`app/dashboard/demandes/page.tsx`)

#### Intégration des nouvelles méthodes :

```typescript
// Fonction pour approuver une demande
const handleApproveRequest = async (requestId: string) => {
  const result = await edgeFunctionService.approveRequest(
    session.access_token,
    {
      requestId: requestId,
      action: "approve",
      approverId: session.partner?.id,
      approverRole: "rh",
      reason: "Demande approuvée par le service RH",
    }
  );
};

// Fonction pour rejeter une demande
const handleRejectRequest = async (requestId: string) => {
  const result = await edgeFunctionService.rejectRequest(session.access_token, {
    requestId: requestId,
    action: "reject",
    approverId: session.partner?.id,
    approverRole: "responsable",
    reason: "Demande rejetée par le service RH",
  });
};
```

## Utilisation

### 1. Appel des méthodes

```typescript
import { edgeFunctionService } from "@/lib/edgeFunctionService";

// Approuver une demande
const approveResult = await edgeFunctionService.approveRequest(accessToken, {
  requestId: "demande-id",
  action: "approve",
  approverId: "approver-id",
  approverRole: "rh",
  reason: "Demande justifiée",
});

// Rejeter une demande
const rejectResult = await edgeFunctionService.rejectRequest(accessToken, {
  requestId: "demande-id",
  action: "reject",
  approverId: "approver-id",
  approverRole: "responsable",
  reason: "Montant trop élevé",
});
```

### 2. Gestion des réponses

```typescript
if (result.success) {
  toast.success(result.message);
  // Recharger les données
  await loadDemandes();
} else {
  toast.error(result.message);
}
```

## Tests

### Fichier de test (`test_partner_approval.js`)

Le fichier de test vérifie :

1. **Récupération des demandes** en attente RH/Responsable
2. **Structure de la base de données** et colonnes disponibles
3. **Validation des données** pour l'API
4. **Statistiques** des demandes par montant et date
5. **Configuration** de la route API et des méthodes

### Exécution des tests

```bash
node test_partner_approval.js
```

## Sécurité

### Authentification

- Vérification du token Bearer dans chaque requête
- Validation du token avec Supabase Auth
- Rejet des requêtes non authentifiées (401)

### Autorisation

- Seuls les RH et Responsables peuvent approuver/rejeter
- Validation des rôles dans l'API
- Vérification du statut de la demande

### Validation des données

- Vérification des champs requis
- Validation des valeurs autorisées
- Protection contre les injections

## Gestion d'erreurs

### Codes d'erreur HTTP

- **400** : Données manquantes ou invalides
- **401** : Authentification requise ou invalide
- **404** : Demande non trouvée
- **500** : Erreur interne du serveur

### Messages d'erreur

- Messages clairs et informatifs
- Localisation en français
- Suggestions d'actions correctives

## Workflow complet

### 1. Demande créée

- Statut initial : "En attente RH/Responsable"
- Montant : 30-50% du salaire

### 2. RH/Responsable examine

- Interface de la page Demandes
- Boutons Approuver/Rejeter
- Informations détaillées de la demande

### 3. Action d'approbation/rejet

- Appel de l'API via le service Edge Function
- Validation et mise à jour en base
- Notifications automatiques

### 4. Résultat

- **Approbation** : Statut → "Validé", paiement initié
- **Rejet** : Statut → "Rejeté", motif enregistré

### 5. Traçabilité

- Historique des actions
- Horodatage des décisions
- Informations sur l'approbateur

## Maintenance

### Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Dépendances

- `@supabase/supabase-js` : Client Supabase
- `next/server` : API routes Next.js
- `sonner` : Notifications toast

### Monitoring

- Logs des erreurs dans la console
- Traçabilité des actions dans l'historique
- Statistiques des demandes par statut

## Évolutions futures

### Fonctionnalités à ajouter

1. **Notifications push** : Notifications en temps réel
2. **Workflow multi-niveaux** : Approbation en cascade
3. **Documents joints** : Justificatifs et pièces
4. **Rapports avancés** : Analytics et métriques
5. **Intégration paiement** : Paiement automatique via Djomy

### Améliorations techniques

1. **Cache** : Mise en cache des données fréquentes
2. **Rate limiting** : Protection contre les abus
3. **Audit trail** : Journal détaillé des actions
4. **API versioning** : Gestion des versions d'API
5. **Tests automatisés** : Tests unitaires et d'intégration
