# Fonctionnalité de Rejet des Inscriptions d'Employés

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux RH (Responsables des Ressources Humaines) de rejeter les demandes d'inscription d'employés au lieu de pouvoir seulement les créer. Elle utilise l'Edge Function `partner-employees` avec la route `/reject`.

## 🔧 Implémentation

### 1. Service Edge Function

**Fichier**: `lib/edgeFunctionService.ts`

```typescript
// Nouvelle méthode ajoutée
async rejectEmployeeRegistration(
  accessToken: string,
  request: { employee_id: string; reason?: string }
): Promise<PartnerAuthResponse>
```

**URL de l'Edge Function**: `${SUPABASE_URL}/functions/v1/partner-employees/reject`

### 2. Interface Utilisateur

**Fichier**: `app/dashboard/demandes-adhesion/page.tsx`

#### Nouvelles fonctionnalités ajoutées :

1. **Bouton "Rejeter"** dans la liste des employés
2. **Bouton "Rejeter l'inscription"** dans le modal de détails
3. **Modal de confirmation** pour le rejet avec motif optionnel
4. **États de chargement** pendant le traitement

#### Nouvelles icônes utilisées :

- `X` - Icône de rejet
- `AlertTriangle` - Icône d'alerte dans le modal

## 🎯 Fonctionnalités

### Interface de Rejet

1. **Liste des employés** :

   - Bouton "Rejeter" rouge avec icône X
   - État de chargement pendant le traitement
   - Désactivation pendant le traitement

2. **Modal de détails** :

   - Bouton "Rejeter l'inscription" dans les actions
   - Même style que le bouton de la liste

3. **Modal de confirmation** :
   - Affichage des informations de l'employé
   - Champ de texte pour le motif (optionnel)
   - Boutons "Annuler" et "Confirmer le rejet"
   - Indication que le motif sera envoyé par email et SMS

### Gestion des États

- `rejectingEmployee` : ID de l'employé en cours de rejet
- `isRejectModalOpen` : État d'ouverture du modal de confirmation
- `rejectReason` : Motif du rejet saisi par l'utilisateur

## 🔄 Flux de Rejet

1. **Clic sur "Rejeter"** → Ouverture du modal de confirmation
2. **Saisie du motif** (optionnel) → Validation côté client
3. **Confirmation** → Appel à l'Edge Function
4. **Succès** → Suppression de l'employé de la liste + Notification
5. **Erreur** → Affichage du message d'erreur

## 📡 API Edge Function

### Endpoint

```
POST /functions/v1/partner-employees/reject
```

### Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Body

```json
{
  "employee_id": "uuid-de-l-employe",
  "reason": "Motif du rejet (optionnel)"
}
```

### Réponses

#### Succès (200)

```json
{
  "success": true,
  "message": "Inscription rejetée avec succès",
  "data": {
    "employee_id": "uuid-de-l-employe",
    "reason": "Motif du rejet",
    "rejected_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Erreur (400)

```json
{
  "success": false,
  "message": "Données invalides ou employé avec demandes actives",
  "error": "EMPLOYEE_HAS_ACTIVE_REQUESTS"
}
```

#### Erreur (401)

```json
{
  "success": false,
  "message": "Token d'authentification invalide ou manquant",
  "error": "UNAUTHORIZED"
}
```

#### Erreur (404)

```json
{
  "success": false,
  "message": "Employé non trouvé",
  "error": "EMPLOYEE_NOT_FOUND"
}
```

## 🧪 Tests

### Fichier de Test

**Fichier**: `test_employee_rejection.js`

### Cas de Test Couverts

1. ✅ **Rejet avec motif** - Test normal avec raison
2. ✅ **Rejet sans motif** - Test sans raison
3. ✅ **ID invalide** - Validation des données
4. ✅ **Token manquant** - Authentification
5. ✅ **Employé avec demandes actives** - Validation métier
6. ✅ **Employé non trouvé** - Gestion des erreurs

### Exécution des Tests

```bash
node test_employee_rejection.js
```

## 🔐 Sécurité

### Authentification

- Token d'accès requis dans les headers
- Validation du token côté Edge Function
- Vérification des permissions RH

### Validation des Données

- Validation de l'UUID de l'employé
- Vérification de l'existence de l'employé
- Contrôle des demandes actives

### Notifications

- Email automatique à l'employé rejeté
- SMS de notification
- Email de notification au partenaire
- Notification admin dans la base de données

## 🎨 Interface Utilisateur

### Couleurs et Styles

- **Bouton Rejeter** : Rouge (`text-red-600`, `border-red-200`)
- **Modal de confirmation** : Thème d'alerte avec bordures rouges
- **États de chargement** : Spinner avec désactivation des boutons

### Responsive Design

- Adaptation mobile et desktop
- Modal responsive avec scroll si nécessaire
- Boutons adaptatifs selon la taille d'écran

## 📱 Notifications

### Types de Notifications

1. **Toast de succès** : "Inscription d'employé rejetée avec succès"
2. **Toast d'erreur** : Messages d'erreur spécifiques
3. **Email à l'employé** : Notification avec motif
4. **SMS à l'employé** : Notification courte
5. **Email au partenaire** : Confirmation du rejet

## 🔄 Mise à Jour de l'Interface

### Actions Automatiques

- Suppression de l'employé de la liste après rejet
- Mise à jour des compteurs
- Fermeture des modals
- Réinitialisation des états

### Gestion des Erreurs

- Affichage des messages d'erreur spécifiques
- Retry automatique en cas d'erreur réseau
- Fallback gracieux en cas d'échec

## 🚀 Déploiement

### Prérequis

- Edge Function `partner-employees` déployée
- Route `/reject` configurée
- Permissions RH configurées
- Notifications email/SMS configurées

### Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://mspmrzlqhwpdkkburjiw.supabase.co
```

## 📊 Monitoring

### Logs à Surveiller

- Appels à l'Edge Function `/reject`
- Taux de succès/échec des rejets
- Temps de réponse de l'API
- Erreurs d'authentification

### Métriques

- Nombre de rejets par jour/semaine
- Motifs de rejet les plus fréquents
- Temps moyen de traitement
- Taux d'erreur par type

## 🔧 Maintenance

### Points d'Attention

- Vérification régulière des logs Edge Function
- Test des notifications email/SMS
- Validation des permissions RH
- Mise à jour des messages d'erreur

### Améliorations Futures

- Historique des rejets
- Templates de motifs prédéfinis
- Notifications push
- Export des données de rejet
