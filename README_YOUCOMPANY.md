# Dashboard Partenaire YouCompany

## Configuration du Projet

### 1. Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec les informations suivantes :

```env
# Configuration Supabase - Projet YouCompany
NEXT_PUBLIC_SUPABASE_URL=https://mspmrzlqhwpdkkburjiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0

# JWT Secret (optionnel pour les tests)
JWT_SECRET=TToKkkkQ3YcMXkEgSQJn34IfrYtuSlIy9CEdOtkARwvs8ddV1TLNHMmcxBXOMJ4sLZ6lXw8AJLDtgDrdHtvYOA

# Informations du partenaire YouCompany
NEXT_PUBLIC_PARTNER_NAME=YouCompany
NEXT_PUBLIC_PARTNER_REPRESENTANT=Ousmane Sow
NEXT_PUBLIC_PARTNER_EMAIL=ousmane.sow@youcompany.com
NEXT_PUBLIC_PARTNER_RH_EMAIL=aissatou.bah@youcompany.com
```

### 2. Configuration de la Base de Données

Exécutez le script SQL `add_youcompany_partner.sql` dans votre base de données Supabase pour créer les utilisateurs et le partenaire YouCompany.

#### Utilisateurs Créés :

1. **Directeur Général YouCompany**
   - Email: `ousmane.sow@youcompany.com`
   - Mot de passe: `Samy2004@`
   - Poste: Directeur Général

2. **Directrice RH YouCompany**
   - Email: `aissatou.bah@youcompany.com`
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
2. Connectez-vous avec l'un des comptes YouCompany :
   - **Directeur Général**: `ousmane.sow@youcompany.com` / `Samy2004@`
   - **Directrice RH**: `aissatou.bah@youcompany.com` / `Samy2004@`

## Informations sur YouCompany

### Profil de l'Entreprise
- **Nom**: YouCompany
- **Secteur**: Technologie
- **Description**: Entreprise innovante spécialisée dans les solutions digitales et le développement logiciel
- **Nombre d'employés**: 60
- **Salaire net total**: 30,000,000 GNF
- **Localisation**: Conakry, Guinée

### Équipe de Direction
- **Directeur Général**: Ousmane Sow
  - Email: ousmane.sow@youcompany.com
  - Téléphone: +224 633 444 555

- **Directrice RH**: Aissatou Bah
  - Email: aissatou.bah@youcompany.com
  - Téléphone: +224 644 555 666

### Employés Créés
1. **Ibrahim Keita** - Développeur Senior (850,000 GNF)
2. **Mariama Diallo** - Chef de Projet (950,000 GNF)
3. **Sekou Camara** - Analyste Business (750,000 GNF)
4. **Fatoumata Sow** - Designer UX/UI (700,000 GNF)
5. **Mamadou Bah** - DevOps Engineer (900,000 GNF)

## Fonctionnalités Disponibles

### 1. **Dashboard Principal**
- Vue d'ensemble des activités
- Graphiques de performance
- Alertes et notifications
- Statistiques des employés

### 2. **Gestion des Employés**
- Liste des 5 employés créés
- Informations détaillées (poste, salaire, contrat)
- Ajout/modification d'employés
- Suivi des contrats

### 3. **Demandes d'Avance de Salaire**
- **3 demandes créées** :
  - Ibrahim Keita : 300,000 GNF (Frais médicaux urgents) - EN_ATTENTE
  - Mariama Diallo : 500,000 GNF (Achat équipement) - APPROUVEE
  - Sekou Camara : 200,000 GNF (Frais de transport) - EN_ATTENTE
- Suivi des statuts
- Traitement des demandes

### 4. **Finances**
- **3 transactions créées** :
  - Avance sur salaire : 500,000 GNF (Débloqué)
  - Remboursement frais médicaux : 300,000 GNF (Récupéré)
  - Commission de vente : 200,000 GNF (Revenu)
- Suivi des transactions
- Rapports financiers

### 5. **Avis et Évaluations**
- **3 avis créés** avec notes et commentaires
- Système d'approbation des avis
- Types de retour (positif/négatif)

### 6. **Messages et Notifications**
- Communication interne
- Notifications système
- Alertes importantes

## Structure des Données

Le script crée automatiquement :
- ✅ **2 utilisateurs** (DG et RH)
- ✅ **1 partenaire** (YouCompany)
- ✅ **5 employés** avec informations complètes
- ✅ **3 demandes d'avance de salaire** avec différents statuts
- ✅ **3 avis** avec notes et commentaires
- ✅ **3 transactions financières** de différents types

## Sécurité

- Authentification par email/mot de passe
- Mots de passe hashés avec SHA-256
- Sessions stockées dans le localStorage
- Middleware de protection des routes

## Test de Connexion

Utilisez le script `test_youcompany_login.ts` pour vérifier que tout fonctionne correctement :

```bash
npx ts-node test_youcompany_login.ts
```

## Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Note**: Ce projet est spécifiquement configuré pour le partenaire YouCompany avec Ousmane Sow comme Directeur Général et Aissatou Bah comme Directrice RH. Toutes les données de test sont incluses pour une expérience complète du dashboard partenaire. 