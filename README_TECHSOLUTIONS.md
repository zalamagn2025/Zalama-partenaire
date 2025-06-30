# Dashboard Partenaire TechSolutions SARL

## Configuration du Projet

### 1. Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec les informations suivantes :

```env
# Configuration Supabase - Projet TechSolutions
NEXT_PUBLIC_SUPABASE_URL=https://mspmrzlqhwpdkkburjiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0

# JWT Secret (optionnel pour les tests)
JWT_SECRET=TToKkkkQ3YcMXkEgSQJn34IfrYtuSlIy9CEdOtkARwvs8ddV1TLNHMmcxBXOMJ4sLZ6lXw8AJLDtgDrdHtvYOA

# Informations du partenaire TechSolutions
NEXT_PUBLIC_PARTNER_NAME=TechSolutions SARL
NEXT_PUBLIC_PARTNER_REPRESENTANT=Mamadou Diallo
NEXT_PUBLIC_PARTNER_EMAIL=mamadou.diallo@techsolutions.com
NEXT_PUBLIC_PARTNER_RH_EMAIL=fatou.camara@techsolutions.com
```

### 2. Configuration de la Base de Données

Exécutez le script SQL `add_techsolutions_partner.sql` dans votre base de données Supabase pour créer les utilisateurs et le partenaire TechSolutions.

#### Utilisateurs Créés :

1. **Directeur Général TechSolutions**
   - Email: `mamadou.diallo@techsolutions.com`
   - Mot de passe: `Samy2004@`
   - Poste: Directeur Général

2. **Directrice RH TechSolutions**
   - Email: `fatou.camara@techsolutions.com`
   - Mot de passe: `Samy2004@`
   - Poste: Directrice RH

### 3. Installation et Démarrage

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### 4. Accès au Dashboard

1. Ouvrez votre navigateur et allez sur `http://localhost:3000`
2. Connectez-vous avec l'un des comptes TechSolutions :
   - **Directeur Général**: `mamadou.diallo@techsolutions.com` / `Samy2004@`
   - **Directrice RH**: `fatou.camara@techsolutions.com` / `Samy2004@`

## Informations sur TechSolutions SARL

### Profil de l'Entreprise
- **Nom**: TechSolutions SARL
- **Secteur**: Technologie
- **Description**: Entreprise leader dans le développement de solutions technologiques innovantes
- **Nombre d'employés**: 75
- **Salaire net total**: 35,000,000 GNF
- **Localisation**: Conakry, Guinée

### Équipe de Direction
- **Directeur Général**: Mamadou Diallo
  - Email: mamadou.diallo@techsolutions.com
  - Téléphone: +224 611 222 333

- **Directrice RH**: Fatou Camara
  - Email: fatou.camara@techsolutions.com
  - Téléphone: +224 622 333 444

## Architecture du Projet

### Structure des Données

- **Table `users`**: Stocke les informations des utilisateurs (DG et RH)
- **Table `partners`**: Stocke les informations du partenaire TechSolutions
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

**Note**: Ce projet est spécifiquement configuré pour le partenaire TechSolutions SARL avec Mamadou Diallo comme Directeur Général et Fatou Camara comme Directrice RH. 