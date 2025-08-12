# 🔧 Dépannage Système OTP

## 🚨 Problème : Erreur 404 sur /api/otp/send

### Symptômes

- `Failed to load resource: the server responded with a status of 404 (Not Found)`
- `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

### Solutions

#### 1. Vérifier que le serveur est démarré

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm run dev
```

#### 2. Vérifier que le fichier API existe

```bash
# Vérifier que le fichier existe
ls app/api/otp/send/route.ts
```

#### 3. Vérifier la structure des dossiers

```
app/
├── api/
│   └── otp/
│       ├── send/
│       │   └── route.ts  ← Ce fichier doit exister
│       └── verify/
│           └── route.ts
```

#### 4. Redémarrer le serveur après modification

```bash
# Toujours redémarrer après avoir ajouté/modifié des fichiers API
npm run dev
```

## 🚨 Problème : Email non envoyé

### Vérifications

#### 1. Variables d'environnement

```bash
# Exécuter le script de vérification
node test_env_config.js
```

#### 2. Créer/modifier le fichier .env

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_actual_resend_api_key_here

# SMS Service (Nimba SMS)
NIMBA_SMS_SERVICE_ID=your_service_id_here
NIMBA_SMS_SECRET_TOKEN=your_secret_token_here
```

#### 3. Obtenir une clé Resend

1. Allez sur [Resend](https://resend.com)
2. Créez un compte
3. Obtenez votre clé API (commence par `re_`)
4. Ajoutez-la au fichier `.env`

## 🚨 Problème : Utilisateur non trouvé

### Vérifications

#### 1. Vérifier la base de données

```bash
# Exécuter le script de test
node test_otp_api.js
```

#### 2. Vérifier que l'utilisateur existe

```sql
-- Dans Supabase SQL Editor
SELECT * FROM admin_users
WHERE email = 'morykoulibaly1223@gmail.com'
AND active = true;
```

#### 3. Créer l'utilisateur si nécessaire

```sql
-- Créer l'utilisateur dans admin_users
INSERT INTO admin_users (
  id, email, display_name, role, partenaire_id, active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'morykoulibaly1223@gmail.com',
  'Mory Koulibaly',
  'admin',
  'your_partner_id',
  true,
  NOW(),
  NOW()
);
```

## 🚨 Problème : Table otp_sessions manquante

### Créer la table

```sql
-- Dans Supabase SQL Editor
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

## 🔍 Tests de diagnostic

### 1. Test complet de l'environnement

```bash
node test_env_config.js
```

### 2. Test de l'API et de la base de données

```bash
node test_otp_api.js
```

### 3. Test du système complet

```bash
node test_otp_system.js
```

## 📋 Checklist de résolution

- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Fichier `app/api/otp/send/route.ts` existe
- [ ] Variables d'environnement configurées dans `.env`
- [ ] Clé Resend valide (commence par `re_`)
- [ ] Table `otp_sessions` créée dans Supabase
- [ ] Utilisateur existe dans `admin_users` avec `active = true`
- [ ] Serveur redémarré après modifications

## 🆘 Si rien ne fonctionne

### 1. Vérifier les logs du serveur

```bash
# Dans le terminal où npm run dev est lancé
# Regarder les erreurs qui s'affichent
```

### 2. Vérifier la console du navigateur

- Ouvrir les outils de développement (F12)
- Aller dans l'onglet Console
- Regarder les erreurs

### 3. Tester l'API directement

```bash
# Test avec curl
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"morykoulibaly1223@gmail.com"}'
```

## 📞 Support

Si le problème persiste :

1. Copiez les messages d'erreur exacts
2. Exécutez les scripts de test
3. Partagez les résultats
4. Contactez l'équipe de développement
