# Intégration API Djomy - Documentation

## 📋 Vue d'ensemble

Cette documentation décrit l'intégration de l'API Djomy pour le traitement des remboursements d'avances salariales dans l'application Partner.

## 🏖️ Environnement Sandbox

L'intégration utilise l'environnement **sandbox** de Djomy, qui permet de :

- Tester toutes les fonctionnalités sans risque financier
- Valider l'intégration avant la mise en production
- Développer et déboguer en toute sécurité

## 🔧 Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Djomy Payment Platform API (Sandbox)
NEXT_PUBLIC_DJOMY_API_URL=https://api-sandbox.djomy.com
NEXT_PUBLIC_DJOMY_CLIENT_ID=votre_client_id_ici
NEXT_PUBLIC_DJOMY_CLIENT_SECRET=votre_client_secret_ici

# Djomy Webhook URL (optionnel)
DJOMY_WEBHOOK_URL=https://votre-domaine.com/api/djomy-webhook
```

### Installation des dépendances

```bash
npm install crypto-js @types/crypto-js
```

## 🏗️ Architecture

### Structure des fichiers

```
lib/
├── djomyService.ts          # Service principal Djomy
└── supabase.ts             # Configuration Supabase

app/
├── api/
│   ├── djomy-webhook/       # Webhook Djomy
│   └── remboursements/
│       └── djomy-payment/   # API intégration remboursements
└── dashboard/
    └── remboursements-test/ # Page de test
```

### Service Djomy (`lib/djomyService.ts`)

Le service principal gère :

- Authentification HMAC-SHA256
- Initiation de paiements
- Création de liens de paiement
- Vérification de statuts
- Fonctions utilitaires

## 🔐 Authentification

### Génération de signature HMAC

```typescript
// Exemple de génération de signature
const signature = CryptoJS.HmacSHA256(clientId, clientSecret);
const apiKey = `${clientId}:${signature}`;
```

### Headers requis

```typescript
headers: {
  "Content-Type": "application/json",
  "X-API-KEY": apiKey,        // Pour l'authentification
  "Authorization": `Bearer ${token}` // Pour les opérations
}
```

## 💳 Fonctionnalités

### 1. Paiement Direct

Initier un paiement direct vers un numéro de téléphone :

```typescript
const paymentData = {
  paymentMethod: "OM", // Orange Money
  payerIdentifier: "00224623707722",
  amount: 10000, // 10 000 GNF
  countryCode: "GN", // Guinée
  description: "Remboursement avance",
  merchantPaymentReference: "REF-001",
};

const response = await djomyService.initiatePayment(paymentData);
```

### 2. Lien de Paiement

Créer un lien de paiement partageable :

```typescript
const linkData = {
  amountToPay: 10000,
  linkName: "Remboursement Avance",
  phoneNumber: "00224623707722",
  description: "Remboursement avance salariale",
  countryCode: "GN",
  usageType: "UNIQUE", // ou "MULTIPLE"
  merchantReference: "LINK-REF-001",
};

const response = await djomyService.createPaymentLink(linkData);
```

### 3. Vérification de Statut

Vérifier le statut d'une transaction :

```typescript
const status = await djomyService.checkPaymentStatus(transactionId);
```

## 🔗 Webhooks

### Configuration

L'URL du webhook doit être configurée dans l'espace marchand Djomy :

```
https://votre-domaine.com/api/djomy-webhook
```

### Événements supportés

- `payment.created` : Paiement créé
- `payment.pending` : Paiement en attente
- `payment.success` : Paiement réussi
- `payment.failed` : Paiement échoué

### Traitement des webhooks

Le webhook met automatiquement à jour :

- Le statut du remboursement
- La date de paiement
- Les informations de transaction

## 🧪 Tests

### Page de test

Accédez à `/dashboard/remboursements-test` pour tester :

- Paiements directs
- Création de liens
- Vérification de statuts

### Script de test

```bash
node test_djomy_integration.js
```

Ce script teste :

- Authentification
- Création de liens
- Initiation de paiements
- Vérification de statuts

## 📱 Méthodes de paiement

### Supportées par pays

| Pays          | Code | Méthodes       |
| ------------- | ---- | -------------- |
| Guinée        | GN   | OM, MOMO, KULU |
| Côte d'Ivoire | CI   | OM, MOMO, KULU |
| Sénégal       | SN   | OM, MOMO, KULU |

### Codes des méthodes

- `OM` : Orange Money
- `MOMO` : MTN Mobile Money
- `KULU` : Kulu Digital Pay
- `YMO` : YMO (bientôt)
- `PAYCARD` : PayCard (bientôt)
- `SOUTOURA` : Soutoura Money (bientôt)

## 🔄 Intégration avec les remboursements

### API Route

`POST /api/remboursements/djomy-payment`

```typescript
{
  "remboursementId": "uuid",
  "paymentMethod": "OM"
}
```

### Réponse

```typescript
{
  "success": true,
  "message": "Paiement initié avec succès",
  "data": {
    "transactionId": "djomy-transaction-id",
    "paymentUrl": "https://...",
    "remboursementId": "uuid",
    "employeeName": "Nom Prénom",
    "amount": 10000
  }
}
```

## 🛠️ Développement

### Ajout d'une nouvelle méthode de paiement

1. Ajouter le code dans `DjomyPaymentRequest`
2. Mettre à jour `getAvailablePaymentMethods()`
3. Tester dans l'environnement sandbox

### Gestion des erreurs

```typescript
try {
  const response = await djomyService.initiatePayment(data);
  // Traitement du succès
} catch (error) {
  console.error("Erreur Djomy:", error);
  // Gestion de l'erreur
}
```

## 📊 Monitoring

### Logs à surveiller

- Authentification réussie/échouée
- Création de paiements
- Réception de webhooks
- Erreurs de statut

### Métriques importantes

- Taux de succès des paiements
- Temps de réponse de l'API
- Erreurs d'authentification
- Webhooks reçus

## 🔒 Sécurité

### Bonnes pratiques

- Ne jamais exposer les clés secrètes côté client
- Valider toutes les données reçues
- Utiliser HTTPS en production
- Surveiller les logs d'accès

### Validation des données

```typescript
// Validation du numéro de téléphone
const isValid = djomyService.validatePhoneNumber(phone, countryCode);

// Validation du montant
if (amount <= 0) {
  throw new Error("Montant invalide");
}
```

## 🚀 Déploiement

### Prérequis

1. Compte Djomy actif
2. Clés API configurées
3. URL de webhook accessible
4. SSL/TLS en production

### Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Webhook URL configurée dans Djomy
- [ ] Tests passés en sandbox
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

## 📞 Support

### Ressources

- [Documentation API Djomy](https://djomy.com/api)
- [Espace marchand Djomy](https://merchant.djomy.com)
- [Support technique](mailto:support@djomy.com)

### Dépannage

1. Vérifier les clés API
2. Tester l'authentification
3. Vérifier les logs
4. Contacter le support Djomy

## 🔄 Migration vers la production

Une fois les tests sandbox validés :

1. Changer l'URL API vers la production
2. Mettre à jour les clés API
3. Configurer le webhook de production
4. Tester avec de petits montants
5. Surveiller les premières transactions

---

**Note** : Cette intégration est en mode sandbox. Pour la production, contactez l'équipe Djomy pour obtenir les accès de production.
