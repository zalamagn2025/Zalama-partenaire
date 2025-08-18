# 🔐 Nouvelles Fonctionnalités OTP et Sécurité

## 📋 Vue d'ensemble

De nouvelles routes ont été ajoutées à l'Edge Function `partner-auth` pour améliorer la sécurité de l'authentification :

- **Vérification OTP** : Connexion sécurisée en deux étapes
- **Changement de mot de passe sécurisé** : Validation stricte et email de confirmation
- **Première connexion** : Changement de mot de passe obligatoire

## 🚀 Nouvelles Routes Edge Function

### 1. POST /send-otp

Envoie un code OTP par email pour la connexion sécurisée.

**Requête :**

```json
{
  "email": "rh@example.com",
  "password": "motdepasse123"
}
```

**Réponse :**

```json
{
  "success": true,
  "sessionId": "uuid-session",
  "message": "Code de vérification envoyé à votre email"
}
```

### 2. POST /verify-otp

Vérifie un code OTP et valide la session de connexion.

**Requête :**

```json
{
  "sessionId": "uuid-session",
  "otp": "123456"
}
```

**Réponse :**

```json
{
  "success": true,
  "email": "rh@example.com",
  "message": "Code de vérification validé avec succès"
}
```

### 3. POST /change-password

Change le mot de passe de l'utilisateur connecté de manière sécurisée.

**Requête :**

```json
{
  "current_password": "ancienMotDePasse123!",
  "new_password": "nouveauMotDePasse456!",
  "confirm_password": "nouveauMotDePasse456!"
}
```

**Réponse :**

```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès. Un email de confirmation a été envoyé."
}
```

## 🔧 Mise à Jour du Service Edge Function

### Nouvelles Interfaces

```typescript
export interface SendOtpRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  sessionId: string;
  otp: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
```

### Nouvelles Méthodes

```typescript
// Envoi d'OTP pour connexion sécurisée
async sendOtp(request: SendOtpRequest): Promise<PartnerAuthResponse>

// Vérification d'OTP
async verifyOtp(request: VerifyOtpRequest): Promise<PartnerAuthResponse>

// Changement de mot de passe sécurisé
async changePassword(accessToken: string, request: ChangePasswordRequest): Promise<PartnerAuthResponse>
```

## 🎨 Nouveaux Composants

### 1. OTPModal (`components/auth/OTPModal.tsx`)

Composant modal pour la vérification OTP avec :

- Envoi automatique de l'OTP
- Timer pour le renvoi (60 secondes)
- Validation en temps réel
- Interface utilisateur intuitive

**Utilisation :**

```tsx
<OTPModal
  isOpen={showOTP}
  onClose={() => setShowOTP(false)}
  onSuccess={(email) => handleOTPSuccess(email)}
  email={email}
  password={password}
/>
```

### 2. Page Première Connexion (`app/admin/first-login-change-password/page.tsx`)

Page dédiée pour le changement de mot de passe obligatoire lors de la première connexion :

- Validation stricte des critères de sécurité
- Indicateurs visuels de la force du mot de passe
- Redirection automatique vers le dashboard

## 🔒 Validation de Sécurité

### Critères de Mot de Passe

Le nouveau système impose des critères stricts :

- ✅ **Au moins 8 caractères**
- ✅ **Une lettre majuscule**
- ✅ **Une lettre minuscule**
- ✅ **Un chiffre**
- ✅ **Un caractère spécial (@$!%\*?&)**

### Validation Côté Client

```typescript
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!passwordRegex.test(newPassword)) {
  toast.error(
    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)"
  );
  return;
}
```

## 📱 Mise à Jour de la Page Paramètres

### Section Sécurité Améliorée

La page des paramètres (`app/dashboard/parametres/page.tsx`) a été mise à jour avec :

1. **Champ mot de passe actuel** : Vérification de l'ancien mot de passe
2. **Validation en temps réel** : Affichage des critères de sécurité
3. **Intégration Edge Function** : Utilisation de la nouvelle route `/change-password`
4. **Gestion d'erreurs améliorée** : Messages d'erreur spécifiques

### Fonction `handlePasswordChange` Mise à Jour

```typescript
const handlePasswordChange = async () => {
  // Validation des champs
  if (
    !passwordData.currentPassword ||
    !passwordData.newPassword ||
    !passwordData.confirmPassword
  ) {
    toast.error("Veuillez remplir tous les champs");
    return;
  }

  // Validation de la correspondance
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    toast.error("Les nouveaux mots de passe ne correspondent pas");
    return;
  }

  // Validation de la complexité
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(passwordData.newPassword)) {
    toast.error(
      "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)"
    );
    return;
  }

  // Appel Edge Function
  const response = await edgeFunctionService.changePassword(
    session.access_token,
    {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    }
  );

  if (response.success) {
    toast.success(
      "Mot de passe changé avec succès. Un email de confirmation a été envoyé."
    );
  }
};
```

## 🔄 Flux d'Authentification OTP

### 1. Connexion Standard

```
Utilisateur → Saisie email/mot de passe → Edge Function /login → Dashboard
```

### 2. Connexion avec OTP (Optionnel)

```
Utilisateur → Saisie email/mot de passe → Edge Function /send-otp → Email OTP
Utilisateur → Saisie code OTP → Edge Function /verify-otp → Dashboard
```

### 3. Première Connexion

```
Utilisateur → Connexion → Vérification require_password_change → Page changement mot de passe
Utilisateur → Changement mot de passe → Edge Function /change-password → Dashboard
```

## 🛡️ Sécurité Renforcée

### Fonctionnalités de Sécurité

1. **Validation stricte** : Critères de mot de passe imposés
2. **Vérification ancien mot de passe** : Sécurité contre les attaques
3. **Email de confirmation** : Notification de changement
4. **Session OTP** : Gestion sécurisée des sessions temporaires
5. **Rate limiting** : Protection contre les attaques par force brute
6. **Logs de sécurité** : Traçabilité des actions sensibles

### Gestion des Erreurs

- **Mot de passe actuel incorrect** : Message spécifique
- **Critères non respectés** : Validation détaillée
- **Session expirée** : Redirection automatique
- **Erreur serveur** : Messages informatifs

## 📊 Tests et Validation

### Tests Manuels

1. **Changement de mot de passe** :

   ```bash
   curl -X POST \
     -H "Authorization: Bearer [VOTRE_TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{
       "current_password": "ancienMotDePasse123!",
       "new_password": "nouveauMotDePasse456!",
       "confirm_password": "nouveauMotDePasse456!"
     }' \
     "https://[PROJECT_ID].supabase.co/functions/v1/partner-auth/change-password"
   ```

2. **Envoi d'OTP** :

   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"rh@example.com","password":"motdepasse123"}' \
     "https://[PROJECT_ID].supabase.co/functions/v1/partner-auth/send-otp"
   ```

3. **Vérification d'OTP** :
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"uuid-session","otp":"123456"}' \
     "https://[PROJECT_ID].supabase.co/functions/v1/partner-auth/verify-otp"
   ```

## 🚀 Déploiement

### Étapes de Déploiement

1. **Mise à jour Edge Function** :

   ```bash
   npx supabase functions deploy partner-auth
   ```

2. **Vérification des variables d'environnement** :

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Configuration email pour les OTP

3. **Tests de validation** :
   - Test de changement de mot de passe
   - Test d'envoi et vérification OTP
   - Test de première connexion

## 📝 Notes Importantes

### Compatibilité

- ✅ **Rétrocompatible** : Les anciennes routes continuent de fonctionner
- ✅ **Migration automatique** : Pas de migration de données requise
- ✅ **Interface cohérente** : Même structure de réponse

### Performance

- ⚡ **OTP expiré** : 10 minutes par défaut
- ⚡ **Rate limiting** : 3 tentatives par minute
- ⚡ **Cache session** : Optimisation des performances

### Maintenance

- 🔧 **Logs détaillés** : Traçabilité complète
- 🔧 **Monitoring** : Surveillance des erreurs
- 🔧 **Backup** : Sauvegarde automatique des configurations

## 🎯 Prochaines Étapes

### Fonctionnalités Futures

1. **Authentification à deux facteurs** : TOTP avec Google Authenticator
2. **Sessions multiples** : Gestion des connexions simultanées
3. **Audit trail** : Historique complet des actions
4. **Notifications push** : Alertes de sécurité en temps réel

### Améliorations

1. **Interface utilisateur** : Amélioration de l'UX
2. **Accessibilité** : Support des lecteurs d'écran
3. **Internationalisation** : Support multilingue
4. **Tests automatisés** : Couverture de tests complète
