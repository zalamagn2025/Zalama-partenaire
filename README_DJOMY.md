# 🚀 Intégration API Djomy - Guide de démarrage rapide

## 🎯 Objectif

Intégrer l'API Djomy pour automatiser les paiements de remboursements d'avances salariales dans l'application Partner.

## ⚡ Démarrage rapide

### 1. Configuration des variables d'environnement

Créez ou modifiez votre fichier `.env.local` :

```env
# Djomy Payment Platform API (Sandbox)
NEXT_PUBLIC_DJOMY_API_URL=https://api-sandbox.djomy.com
NEXT_PUBLIC_DJOMY_CLIENT_ID=votre_client_id_ici
NEXT_PUBLIC_DJOMY_CLIENT_SECRET=votre_client_secret_ici
```

### 2. Installation des dépendances

```bash
npm install crypto-js @types/crypto-js
```

### 3. Test de l'intégration

```bash
# Test via script Node.js
node test_djomy_integration.js

# Ou test via l'interface web
# Accédez à: http://localhost:3000/dashboard/remboursements-test
```

## 🧪 Page de test

Une page de test complète est disponible à l'adresse :

```
/dashboard/remboursements-test
```

Cette page permet de tester :

- ✅ Paiements directs vers numéros de téléphone
- ✅ Création de liens de paiement partageables
- ✅ Vérification des statuts de transaction
- ✅ Authentification HMAC-SHA256

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

- `app/dashboard/remboursements-test/page.tsx` - Page de test
- `lib/djomyService.ts` - Service principal Djomy
- `app/api/djomy-webhook/route.ts` - Webhook Djomy
- `app/api/remboursements/djomy-payment/route.ts` - API intégration
- `test_djomy_integration.js` - Script de test
- `documentation/djomy-integration.md` - Documentation complète

### Fichiers modifiés

- `env.example` - Variables d'environnement ajoutées
- `components/layout/EntrepriseSidebar.tsx` - Lien de navigation ajouté

## 🔐 Authentification

L'API Djomy utilise une authentification HMAC-SHA256 :

```typescript
// Génération de la signature
const signature = CryptoJS.HmacSHA256(clientId, clientSecret);
const apiKey = `${clientId}:${signature}`;

// Headers requis
headers: {
  "X-API-KEY": apiKey,
  "Authorization": `Bearer ${token}`
}
```

## 💳 Fonctionnalités implémentées

### 1. Paiement Direct

```typescript
const payment = await djomyService.initiatePayment({
  paymentMethod: "OM",
  payerIdentifier: "00224623707722",
  amount: 10000,
  countryCode: "GN",
  description: "Remboursement avance",
});
```

### 2. Lien de Paiement

```typescript
const link = await djomyService.createPaymentLink({
  amountToPay: 10000,
  linkName: "Remboursement Avance",
  countryCode: "GN",
  usageType: "UNIQUE",
});
```

### 3. Vérification de Statut

```typescript
const status = await djomyService.checkPaymentStatus(transactionId);
```

## 🔗 Webhooks

Les webhooks sont automatiquement traités pour mettre à jour les statuts :

- `payment.success` → Statut "PAYE"
- `payment.failed` → Statut "ECHOUE"
- `payment.pending` → Statut "EN_ATTENTE"

## 🏖️ Environnement Sandbox

**Important** : L'intégration utilise l'environnement sandbox de Djomy, ce qui signifie :

- ✅ Aucune vraie transaction financière
- ✅ Tests sécurisés sans risque
- ✅ Validation complète de l'intégration
- ✅ Développement et débogage en toute sécurité

## 🚀 Prochaines étapes

1. **Testez l'intégration** avec vos clés API Djomy
2. **Validez les fonctionnalités** dans l'environnement sandbox
3. **Configurez les webhooks** dans votre espace marchand Djomy
4. **Intégrez avec les remboursements existants** une fois les tests validés

## 📞 Support

- **Documentation complète** : `documentation/djomy-integration.md`
- **Script de test** : `test_djomy_integration.js`
- **Page de test** : `/dashboard/remboursements-test`

## 🔄 Migration vers la production

Une fois les tests sandbox validés, vous pourrez :

1. Changer l'URL API vers la production
2. Mettre à jour les clés API de production
3. Configurer le webhook de production
4. Activer l'intégration dans la vraie page remboursements

---

**🎉 L'intégration est prête pour les tests !**

Commencez par configurer vos clés API et tester via la page `/dashboard/remboursements-test`.
