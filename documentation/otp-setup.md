# Configuration du Système OTP

## Vue d'ensemble

Le système OTP (One-Time Password) a été implémenté pour sécuriser l'authentification des utilisateurs. Il utilise une double vérification :

1. **Email** via Resend
2. **SMS** via Nimba SMS (optionnel)

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env` :

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# SMS Service (Nimba SMS)
NIMBA_SMS_SERVICE_ID=your_service_id_here
NIMBA_SMS_SECRET_TOKEN=qf_bpb4CVfEalTU5eVEFC05wpoqlo17M-mozkZVbIHT_3xfOIjB7Oac-lkXZ6Pg2VqO2LXVy6BUlYTZe73y411agSC0jVh3OcOU92s8Rplc
```

## Configuration des services

### 1. Resend (Email)

1. Créez un compte sur [Resend](https://resend.com)
2. Obtenez votre clé API
3. Configurez votre domaine d'envoi
4. Remplacez `re_your_resend_api_key_here` par votre vraie clé API

### 2. Nimba SMS

1. Créez un compte sur [Nimba SMS](https://nimbasms.com)
2. Obtenez votre SERVICE_ID et SECRET_TOKEN
3. Configurez votre sender name
4. Remplacez les valeurs dans le fichier `.env`

## Fonctionnement du système

### Flux d'authentification

1. **Connexion initiale** : L'utilisateur entre son email et mot de passe
2. **Vérification des identifiants** : Le système vérifie les identifiants dans Supabase
3. **Envoi OTP** : Si les identifiants sont corrects, un code OTP est envoyé par email (et SMS si un numéro est fourni)
4. **Modal OTP** : Une modal s'affiche pour saisir le code
5. **Vérification OTP** : Le code est vérifié dans la base de données
6. **Connexion finale** : Si l'OTP est valide, l'utilisateur est connecté et redirigé vers le dashboard

### Sécurité

- **Durée de validité** : 2 minutes
- **Format** : 6 chiffres
- **Usage unique** : Chaque code ne peut être utilisé qu'une fois
- **Nettoyage automatique** : Les codes expirés sont automatiquement supprimés

## API Endpoints

### POST /api/otp/send

Envoie un code OTP par email et SMS.

**Body :**

```json
{
  "email": "user@example.com",
  "phone": "+224123456789" // optionnel
}
```

**Response :**

```json
{
  "success": true,
  "message": "Code de vérification envoyé",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

### POST /api/otp/verify

Vérifie un code OTP.

**Body :**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response :**

```json
{
  "success": true,
  "message": "Code de vérification validé",
  "session": {
    "email": "user@example.com",
    "otpVerified": true,
    "verifiedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## Base de données

### Table `otp_sessions`

```sql
CREATE TABLE public.otp_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  otp character varying NOT NULL CHECK (otp::text ~ '^[0-9]{6}$'::text),
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_sessions_pkey PRIMARY KEY (id)
);
```

## Composants React

### OTPModal

Le composant `OTPModal` gère l'interface utilisateur pour la saisie et vérification du code OTP.

**Props :**

- `isOpen` : boolean - Contrôle l'affichage de la modal
- `onClose` : function - Callback appelé lors de la fermeture
- `email` : string - Email de l'utilisateur
- `phone` : string (optionnel) - Numéro de téléphone
- `onOTPVerified` : function - Callback appelé quand l'OTP est vérifié

**Fonctionnalités :**

- Compte à rebours de 2 minutes
- Bouton de renvoi du code
- Validation en temps réel
- Gestion des erreurs
- Interface responsive

## Tests

Pour tester le système :

1. **Test email** : Utilisez un email valide pour recevoir le code
2. **Test SMS** : Ajoutez un numéro de téléphone valide au format international
3. **Test expiration** : Attendez 2 minutes pour voir l'expiration
4. **Test erreurs** : Entrez un code incorrect pour tester la validation

## Dépannage

### Problèmes courants

1. **Email non reçu** :

   - Vérifiez la clé API Resend
   - Vérifiez que le domaine est configuré
   - Consultez les logs de Resend

2. **SMS non reçu** :

   - Vérifiez les identifiants Nimba SMS
   - Vérifiez le format du numéro de téléphone
   - Consultez les logs Nimba SMS

3. **Erreur de base de données** :
   - Vérifiez la connexion Supabase
   - Vérifiez que la table `otp_sessions` existe
   - Consultez les logs de l'application

### Logs

Les logs sont disponibles dans :

- Console du navigateur (côté client)
- Logs du serveur Next.js (côté serveur)
- Logs des services externes (Resend, Nimba SMS)
