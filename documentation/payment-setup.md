# Configuration de l'URL de Retour de Paiement - Lengopay

## Vue d'ensemble

Cette documentation explique comment configurer l'URL de retour de paiement pour l'intégration avec Lengopay dans votre application ZaLaMa Partner Dashboard.

## URL de Retour

### URL de Base
```
https://votre-domaine.com/payment-result
```

### Paramètres Attendus

L'URL de retour doit inclure les paramètres suivants que Lengopay renverra après le paiement :

#### Paramètres Obligatoires
- `status` : Statut du paiement (`success`, `failed`, `pending`, `error`)
- `transaction_id` : Identifiant unique de la transaction
- `amount` : Montant du paiement
- `currency` : Devise (GNF)

#### Paramètres Optionnels
- `message` : Message de statut ou d'erreur
- `reference` : Référence de la transaction
- `error` : Message d'erreur détaillé (en cas d'échec)
- `remboursement_id` : ID du remboursement (pour les paiements individuels)
- `partenaire_id` : ID du partenaire (pour les paiements en lot)

## Exemples d'URLs de Retour

### Paiement Réussi
```
https://votre-domaine.com/payment-result?status=success&transaction_id=TX123456&amount=500000&currency=GNF&message=Paiement%20réussi&remboursement_id=REM001
```

### Paiement Échoué
```
https://votre-domaine.com/payment-result?status=failed&transaction_id=TX123456&amount=500000&currency=GNF&error=Solde%20insuffisant&remboursement_id=REM001
```

### Paiement en Lot
```
https://votre-domaine.com/payment-result?status=success&transaction_id=TX123456&amount=1500000&currency=GNF&message=Paiement%20en%20lot%20réussi&partenaire_id=PART001
```

## Configuration côté Backend

### 1. API de Paiement Individuel
```javascript
// Dans votre API de paiement
const paymentData = {
  remboursement_id: remboursementId,
  amount: montant,
  currency: 'GNF',
  return_url: 'https://votre-domaine.com/payment-result',
  cancel_url: 'https://votre-domaine.com/dashboard/remboursements',
  webhook_url: 'https://votre-domaine.com/api/payment-webhook'
};
```

### 2. API de Paiement en Lot
```javascript
// Dans votre API de paiement en lot
const batchPaymentData = {
  partenaire_id: partenaireId,
  amount: totalAmount,
  currency: 'GNF',
  return_url: 'https://votre-domaine.com/payment-result',
  cancel_url: 'https://votre-domaine.com/dashboard/remboursements',
  webhook_url: 'https://votre-domaine.com/api/payment-webhook'
};
```

## Webhook Configuration

### URL du Webhook
```
https://votre-domaine.com/api/payment-webhook
```

### Données Attendues
Le webhook recevra les données suivantes :
```json
{
  "transaction_id": "TX123456",
  "status": "success",
  "amount": 500000,
  "currency": "GNF",
  "reference": "REF001",
  "remboursement_id": "REM001",
  "partenaire_id": "PART001",
  "message": "Paiement traité avec succès"
}
```

## Gestion des Erreurs

### Erreurs Communes
1. **Signature invalide** : Vérifiez la signature du webhook
2. **Montant incorrect** : Vérifiez que le montant correspond
3. **Transaction déjà traitée** : Évitez les doublons
4. **Timeout** : Gérer les timeouts de paiement

### Codes d'Erreur Lengopay
- `INSUFFICIENT_FUNDS` : Solde insuffisant
- `INVALID_ACCOUNT` : Compte invalide
- `TRANSACTION_FAILED` : Échec de transaction
- `TIMEOUT` : Délai d'attente dépassé

## Sécurité

### Vérification de Signature
```javascript
function verifySignature(payload, signature, secretKey) {
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### Validation des Données
- Vérifier que le montant correspond à celui enregistré
- Valider l'ID du remboursement
- Contrôler la devise (GNF uniquement)
- Vérifier la date de la transaction

## Tests

### URLs de Test
```
# Test de succès
https://votre-domaine.com/payment-result?status=success&transaction_id=TEST001&amount=100000&currency=GNF&message=Test%20réussi

# Test d'échec
https://votre-domaine.com/payment-result?status=failed&transaction_id=TEST002&amount=100000&currency=GNF&error=Test%20d'échec

# Test en attente
https://votre-domaine.com/payment-result?status=pending&transaction_id=TEST003&amount=100000&currency=GNF&message=Test%20en%20attente
```

## Intégration avec le Dashboard

### 1. Mise à jour du Statut
Le webhook met automatiquement à jour le statut des remboursements dans la base de données.

### 2. Notifications
Les notifications de paiement sont envoyées automatiquement au partenaire.

### 3. Historique
Toutes les transactions sont enregistrées avec leur statut et timestamp.

## Support

Pour toute question concernant l'intégration avec Lengopay :
- Consultez la documentation officielle de Lengopay
- Contactez le support technique de Lengopay
- Vérifiez les logs de votre application pour diagnostiquer les problèmes 