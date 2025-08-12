# Système OTP - Partner

## 🚀 Installation et Configuration

### 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# SMS Service (Nimba SMS)
NIMBA_SMS_SERVICE_ID=your_service_id_here
NIMBA_SMS_SECRET_TOKEN=qf_bpb4CVfEalTU5eVEFC05wpoqlo17M-mozkZVbIHT_3xfOIjB7Oac-lkXZ6Pg2VqO2LXVy6BUlYTZe73y411agSC0jVh3OcOU92s8Rplc
```

### 2. Configuration des services

#### Resend (Email)

1. Créez un compte sur [Resend](https://resend.com)
2. Obtenez votre clé API
3. Configurez votre domaine d'envoi
4. Remplacez `re_your_resend_api_key_here` par votre vraie clé API

#### Nimba SMS

1. Créez un compte sur [Nimba SMS](https://nimbasms.com)
2. Obtenez votre SERVICE_ID et SECRET_TOKEN
3. Configurez votre sender name
4. Remplacez les valeurs dans le fichier `.env`

### 3. Base de données

La table `otp_sessions` est déjà créée dans votre base de données. Si ce n'est pas le cas, exécutez :

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

## 🧪 Tests

### Test complet du système

```bash
# Ajoutez votre numéro de test
export TEST_PHONE="+224123456789"

# Lancez les tests
node test_otp_system.js
```

### Test manuel

1. **Démarrez l'application** :

   ```bash
   npm run dev
   ```

2. **Testez la connexion** :

   - Allez sur `http://localhost:3000/login`
   - Entrez un email et mot de passe valides
   - Vérifiez que la modal OTP s'affiche
   - Vérifiez que vous recevez l'email avec le code

3. **Testez la vérification** :
   - Entrez le code reçu dans la modal
   - Vérifiez que vous êtes redirigé vers le dashboard

## 📁 Structure des fichiers

```
app/
├── api/
│   └── otp/
│       ├── send/
│       │   └── route.ts          # API d'envoi d'OTP
│       └── verify/
│           └── route.ts          # API de vérification d'OTP
├── login/
│   └── page.tsx                  # Page de connexion modifiée
components/
├── auth/
│   └── OTPModal.tsx              # Modal de vérification OTP
types/
└── nimbasms.d.ts                 # Types pour Nimba SMS
documentation/
└── otp-setup.md                  # Documentation détaillée
test_otp_system.js                # Script de test
cleanup_expired_otp.sql           # Script de nettoyage
```

## 🔧 Fonctionnalités

### ✅ Implémentées

- [x] Envoi d'OTP par email (Resend)
- [x] Envoi d'OTP par SMS (Nimba SMS)
- [x] Vérification d'OTP
- [x] Modal de saisie OTP avec compte à rebours
- [x] Gestion des erreurs
- [x] Nettoyage automatique des OTP expirés
- [x] Tests complets du système
- [x] Documentation complète

### 🔄 Flux d'authentification

1. **Connexion initiale** : Email + mot de passe
2. **Vérification des identifiants** : Supabase Auth
3. **Envoi OTP** : Email + SMS (optionnel)
4. **Modal OTP** : Saisie du code à 6 chiffres
5. **Vérification OTP** : Validation en base de données
6. **Connexion finale** : Redirection vers le dashboard

### 🛡️ Sécurité

- **Durée de validité** : 2 minutes
- **Format** : 6 chiffres uniquement
- **Usage unique** : Chaque code ne peut être utilisé qu'une fois
- **Nettoyage automatique** : Suppression des codes expirés
- **Validation côté serveur** : Toutes les vérifications sont faites côté serveur

## 🚨 Dépannage

### Problèmes courants

#### Email non reçu

1. Vérifiez la clé API Resend
2. Vérifiez que le domaine est configuré
3. Consultez les logs de Resend

#### SMS non reçu

1. Vérifiez les identifiants Nimba SMS
2. Vérifiez le format du numéro de téléphone
3. Consultez les logs Nimba SMS

#### Erreur de base de données

1. Vérifiez la connexion Supabase
2. Vérifiez que la table `otp_sessions` existe
3. Consultez les logs de l'application

### Logs

Les logs sont disponibles dans :

- Console du navigateur (côté client)
- Logs du serveur Next.js (côté serveur)
- Logs des services externes (Resend, Nimba SMS)

## 📊 Monitoring

### Statistiques OTP

```sql
-- Statistiques des sessions OTP
SELECT
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN used = true THEN 1 END) as used_sessions,
    COUNT(CASE WHEN used = false THEN 1 END) as unused_sessions,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_sessions,
    AVG(EXTRACT(EPOCH FROM (used_at - created_at))) as avg_verification_time_seconds
FROM otp_sessions;
```

### Nettoyage automatique

Exécutez régulièrement le script de nettoyage :

```bash
# Via psql
psql -d your_database -f cleanup_expired_otp.sql

# Ou via la fonction
SELECT cleanup_expired_otp();
```

## 🔄 Maintenance

### Tâches régulières

1. **Nettoyage des OTP expirés** : Toutes les heures
2. **Vérification des quotas** : Tous les jours
3. **Monitoring des erreurs** : En continu
4. **Mise à jour des dépendances** : Mensuellement

### Scripts utiles

```bash
# Test complet du système
node test_otp_system.js

# Nettoyage des OTP expirés
psql -d your_database -f cleanup_expired_otp.sql

# Vérification des logs
tail -f logs/application.log
```

## 📞 Support

Pour toute question ou problème :

1. Consultez la documentation : `documentation/otp-setup.md`
2. Vérifiez les logs d'erreur
3. Testez avec le script de test
4. Contactez l'équipe de développement

---

**Note** : Ce système OTP est maintenant entièrement fonctionnel et sécurisé. Assurez-vous de configurer correctement les variables d'environnement avant de l'utiliser en production.
