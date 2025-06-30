# Dashboard Partenaire Zalama

## Configuration du Projet

### 1. Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec les informations suivantes :

```env
# Configuration Supabase - Projet Zalama
NEXT_PUBLIC_SUPABASE_URL=https://mspmrzlqhwpdkkburjiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0

# JWT Secret (optionnel pour les tests)
JWT_SECRET=TToKkkkQ3YcMXkEgSQJn34IfrYtuSlIy9CEdOtkARwvs8ddV1TLNHMmcxBXOMJ4sLZ6lXw8AJLDtgDrdHtvYOA

# Informations du partenaire Zalama
NEXT_PUBLIC_PARTNER_NAME=Zalama
NEXT_PUBLIC_PARTNER_REPRESENTANT=Karfalla Diaby
NEXT_PUBLIC_PARTNER_EMAIL=zalamagn@gmail.com
NEXT_PUBLIC_PARTNER_RH_EMAIL=diabykarfalla2@gmail.com
```

### 2. Configuration de la Base de Données

Exécutez le script SQL `add_zalama_partner.sql` dans votre base de données Supabase pour créer les utilisateurs et le partenaire Zalama.

#### Utilisateurs Créés :

1. **Représentant Zalama**
   - Email: `zalamagn@gmail.com`
   - Mot de passe: `Samy2004@`
   - Poste: Représentant

2. **Responsable RH Zalama**
   - Email: `diabykarfalla2@gmail.com`
   - Mot de passe: `Samy2004@`
   - Poste: Responsable RH

### 3. Installation et Démarrage

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### 4. Accès au Dashboard

1. Ouvrez votre navigateur et allez sur `http://localhost:3000`
2. Connectez-vous avec l'un des comptes Zalama :
   - **Représentant**: `zalamagn@gmail.com` / `Samy2004@`
   - **RH**: `diabykarfalla2@gmail.com` / `Samy2004@`

## Architecture du Projet

### Structure des Données

- **Table `users`**: Stocke les informations des utilisateurs (représentant et RH)
- **Table `partners`**: Stocke les informations du partenaire Zalama
- **Table `employees`**: Employés du partenaire
- **Table `financial_transactions`**: Transactions financières
- **Table `demandes`**: Demandes des employés
- **Table `avis`**: Avis et évaluations

### Fonctionnalités Disponibles

1. **Dashboard Principal**
   - Vue d'ensemble des activités
   - Graphiques de performance
   - Alertes et notifications

2. **Gestion des Employés**
   - Liste des employés
   - Ajout/modification d'employés
   - Suivi des contrats

3. **Finances**
   - Suivi des transactions
   - Rapports financiers
   - Gestion des avances

4. **Demandes**
   - Demandes d'avance de salaire
   - Demandes P2P
   - Suivi des statuts

5. **Messages et Notifications**
   - Communication interne
   - Notifications système

## Sécurité

- Authentification par email/mot de passe
- Mots de passe hashés avec SHA-256
- Sessions stockées dans le localStorage
- Middleware de protection des routes

## Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Note**: Ce projet est spécifiquement configuré pour le partenaire Zalama avec Karfalla Diaby comme représentant et responsable RH. 