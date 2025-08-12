# 🔐 Système OTP - Partner

## 📋 Vue d'ensemble

Le système OTP (One-Time Password) de Partner permet une authentification sécurisée en deux étapes. Après la saisie des identifiants, l'utilisateur doit entrer un code de vérification reçu par email.

## 🏗️ Architecture

### Composants principaux

1. **API Routes** :

   - `/api/otp/send` - Génère et envoie un OTP
   - `/api/otp/verify` - Vérifie l'OTP saisi
   - `/api/otp/get-latest` - Récupère le dernier OTP (débogage)

2. **Service d'email** :

   - `lib/emailService.ts` - Service centralisé pour l'envoi d'emails
   - Templates HTML et texte professionnels
   - Intégration avec Resend

3. **Interface utilisateur** :

   - `components/auth/OTPModal.tsx` - Modal de saisie OTP
   - Compte à rebours de 2 minutes
   - Possibilité de renvoyer le code

4. **Authentification** :
   - `app/api/auth/verify-credentials/route.ts` - Vérification des identifiants
   - `hooks/useSession.ts` - Gestion de session avec OTP

## 🔧 Configuration

### Variables d'environnement

```env
# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
TEST_EMAIL=zalamagn@gmail.com

# Nimba SMS (optionnel)
NIMBA_SMS_SERVICE_ID=xxxxxxxxxxxxxxxx
NIMBA_SMS_SECRET_TOKEN=xxxxxxxxxxxxxxxx
NIMBASMS_SENDER_NAME=Partner

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Base de données

Table `otp_sessions` :

```sql
CREATE TABLE otp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Flux d'authentification

1. **Saisie des identifiants** → Vérification via `/api/auth/verify-credentials`
2. **Ouverture de la modal OTP** → Vérification d'OTP existant
3. **Envoi d'OTP** → Génération et envoi par email/SMS
4. **Saisie du code** → Vérification via `/api/otp/verify`
5. **Connexion finale** → Création de session et redirection

## 🛡️ Sécurité

- **OTP à 6 chiffres** généré aléatoirement
- **Expiration automatique** après 2 minutes
- **Suppression des anciens OTP** avant création d'un nouveau
- **Marquage comme utilisé** après vérification réussie
- **Limitation des tentatives** (gérée côté client)

## 🧪 Débogage

### Affichage de l'OTP en console

L'OTP est automatiquement affiché dans :

- **Console du serveur** : Quand l'OTP est généré
- **Console du navigateur** : Quand la modal s'ouvre

### Logs utiles

```bash
# Console serveur
🔐 OTP généré: 123456
📧 Email: user@example.com
⏰ Expire à: 2025-08-12T12:00:00.000Z

# Console navigateur
🔐 OTP pour le débogage: 123456
📧 Email: user@example.com
⏰ Expire à: 2025-08-12T12:00:00.000Z
```

## 📧 Configuration email

### Développement

- Utilise `TEST_EMAIL` pour les tests
- Emails envoyés à l'adresse vérifiée dans Resend

### Production

- Vérifier un domaine dans Resend
- Utiliser `EMAIL_FROM` avec votre domaine
- Retirer la logique de test dans `emailService.ts`

## 🚀 Déploiement

1. **Configurer les variables d'environnement**
2. **Vérifier le domaine email** dans Resend
3. **Tester le système** en développement
4. **Déployer** avec `npm run build`

## 🔍 Dépannage

### Problèmes courants

1. **Email non reçu** :

   - Vérifier la clé API Resend
   - Contrôler le dossier spam
   - Vérifier l'adresse d'expédition

2. **OTP expiré** :

   - Attendre moins de 2 minutes
   - Utiliser le bouton "Renvoyer"

3. **Erreur de vérification** :
   - Vérifier la saisie du code
   - Contrôler la console pour le bon code

## 📝 Notes techniques

- **Double envoi évité** : Vérification d'OTP existant avant envoi
- **Gestion d'erreurs robuste** : Fallback en cas d'échec email
- **Interface responsive** : Modal adaptée mobile/desktop
- **Accessibilité** : Support clavier et lecteurs d'écran
