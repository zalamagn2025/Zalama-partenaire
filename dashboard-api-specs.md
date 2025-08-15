# 📊 Spécifications API Dashboard Principal

## 🎯 **Endpoint Principal**

```
GET /api/dashboard
```

## 📋 **Variables Requises pour le Dashboard**

### 🏢 **Informations Partenaire (Header)**

```json
{
  "partner": {
    "id": "uuid",
    "company_name": "ZaLaMa",
    "activity_domain": "fintech",
    "logo_url": "https://example.com/logo.png",
    "created_at": "2024-01-15T10:30:00Z",
    "status": "active"
  }
}
```

### 📊 **Statistiques Principales (Cartes)**

```json
{
  "statistics": {
    "employees": {
      "total": 10,
      "active": 10,
      "display": "10/10"
    },
    "demandes": {
      "total": 6,
      "per_employee": 0.6
    },
    "average_rating": 4.5
  }
}
```

### 💰 **Performance Financière**

```json
{
  "financial_performance": {
    "total_debloque": 0,
    "a_rembourser_mois": 0,
    "taux_remboursement": 0.0,
    "date_limite_remboursement": "05 septembre 2025",
    "jours_restants": 21,
    "remboursement_cette_semaine": true
  }
}
```

### 📈 **Données Graphiques**

#### **Évolution des Demandes**

```json
{
  "demandes_evolution": [
    {
      "mois": "Août",
      "demandes": 8
    },
    {
      "mois": "Septembre",
      "demandes": 4
    }
  ]
}
```

#### **Montants Débloqués**

```json
{
  "montants_evolution": [
    {
      "mois": "Août",
      "montant": 4000000
    },
    {
      "mois": "Septembre",
      "montant": 2000000
    }
  ]
}
```

#### **Répartition par Motif**

```json
{
  "repartition_motifs": [
    {
      "motif": "education",
      "valeur": 3,
      "color": "#8884d8"
    },
    {
      "motif": "logement",
      "valeur": 1,
      "color": "#82ca9d"
    },
    {
      "motif": "SANTE",
      "valeur": 1,
      "color": "#ffc658"
    },
    {
      "motif": "ALIMENTATION",
      "valeur": 1,
      "color": "#ff7300"
    }
  ]
}
```

### 📄 **Documents et Rapports**

```json
{
  "documents": {
    "total_count": 8,
    "files": [
      {
        "id": "uuid",
        "name": "Relevé mensuel - 2025-08",
        "type": "releve",
        "size": "13.96 KB",
        "date": "06/08/2025",
        "url": "https://example.com/releve-2025-08.pdf"
      },
      {
        "id": "uuid",
        "name": "Statistiques utilisateurs - Mai 2025",
        "type": "statistiques",
        "size": "12.32 KB",
        "date": "06/08/2025",
        "url": "https://example.com/stats-mai-2025.pdf"
      },
      {
        "id": "uuid",
        "name": "Relevé mensuel - SEPTEMBRE 2025",
        "type": "releve",
        "size": "13.78 KB",
        "date": "06/08/2025",
        "url": "https://example.com/releve-sept-2025.pdf"
      },
      {
        "id": "uuid",
        "name": "Statistiques utilisateurs - AOUT 2025",
        "type": "statistiques",
        "size": "854 B",
        "date": "06/08/2025",
        "url": "https://example.com/stats-aout-2025.pdf"
      }
    ]
  }
}
```

## 🔄 **Réponse API Complète**

```json
{
  "success": true,
  "message": "Données du dashboard récupérées avec succès",
  "data": {
    "partner": {
      "id": "uuid",
      "company_name": "ZaLaMa",
      "activity_domain": "fintech",
      "logo_url": "https://example.com/logo.png",
      "created_at": "2024-01-15T10:30:00Z",
      "status": "active"
    },
    "statistics": {
      "employees": {
        "total": 10,
        "active": 10,
        "display": "10/10"
      },
      "demandes": {
        "total": 6,
        "per_employee": 0.6
      },
      "average_rating": 4.5
    },
    "financial_performance": {
      "total_debloque": 0,
      "a_rembourser_mois": 0,
      "taux_remboursement": 0.0,
      "date_limite_remboursement": "05 septembre 2025",
      "jours_restants": 21,
      "remboursement_cette_semaine": true
    },
    "demandes_evolution": [
      {
        "mois": "Août",
        "demandes": 8
      },
      {
        "mois": "Septembre",
        "demandes": 4
      }
    ],
    "montants_evolution": [
      {
        "mois": "Août",
        "montant": 4000000
      },
      {
        "mois": "Septembre",
        "montant": 2000000
      }
    ],
    "repartition_motifs": [
      {
        "motif": "education",
        "valeur": 3,
        "color": "#8884d8"
      },
      {
        "motif": "logement",
        "valeur": 1,
        "color": "#82ca9d"
      },
      {
        "motif": "SANTE",
        "valeur": 1,
        "color": "#ffc658"
      },
      {
        "motif": "ALIMENTATION",
        "valeur": 1,
        "color": "#ff7300"
      }
    ],
    "documents": {
      "total_count": 8,
      "files": [
        {
          "id": "uuid",
          "name": "Relevé mensuel - 2025-08",
          "type": "releve",
          "size": "13.96 KB",
          "date": "06/08/2025",
          "url": "https://example.com/releve-2025-08.pdf"
        },
        {
          "id": "uuid",
          "name": "Statistiques utilisateurs - Mai 2025",
          "type": "statistiques",
          "size": "12.32 KB",
          "date": "06/08/2025",
          "url": "https://example.com/stats-mai-2025.pdf"
        },
        {
          "id": "uuid",
          "name": "Relevé mensuel - SEPTEMBRE 2025",
          "type": "releve",
          "size": "13.78 KB",
          "date": "06/08/2025",
          "url": "https://example.com/releve-sept-2025.pdf"
        },
        {
          "id": "uuid",
          "name": "Statistiques utilisateurs - AOUT 2025",
          "type": "statistiques",
          "size": "854 B",
          "date": "06/08/2025",
          "url": "https://example.com/stats-aout-2025.pdf"
        }
      ]
    }
  }
}
```

## 📊 **Variables Utilisées dans le Code**

### **Header Section**

- `session.partner.company_name` → `partner.company_name`
- `session.partner.activity_domain` → `partner.activity_domain`
- `session.partner.logo_url` → `partner.logo_url`
- `session.partner.created_at` → `partner.created_at`
- `activeEmployees.length` → `statistics.employees.active`
- `employees.length` → `statistics.employees.total`

### **StatCards**

- `activeEmployees.length/employees.length` → `statistics.employees.display`
- `demandes.length` → `statistics.demandes.total`
- `demandes.length / activeEmployees.length` → `statistics.demandes.per_employee`
- `averageRating` → `statistics.average_rating`

### **Performance Financière**

- `debloqueMois` → `financial_performance.total_debloque`
- `aRembourserMois` → `financial_performance.a_rembourser_mois`
- `((aRembourserMois / debloqueMois) * 100)` → `financial_performance.taux_remboursement`
- `dateLimite` → `financial_performance.date_limite_remboursement`
- `joursRestants` → `financial_performance.jours_restants`

### **Graphiques**

- `demandesEvolutionData` → `demandes_evolution`
- `montantsEvolutionData` → `montants_evolution`
- `repartitionMotifsData` → `repartition_motifs`

### **Documents**

- `DocumentsRapports` component → `documents`

## 🎨 **Formatage des Données**

### **Montants (GNF)**

```javascript
const gnfFormatter = (value) => `${value.toLocaleString()} GNF`;
```

### **Dates**

```javascript
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
```

### **Pourcentages**

```javascript
const formatPercentage = (value) => `${value.toFixed(1)}%`;
```

## 🔧 **Implémentation Recommandée**

1. **Créer l'endpoint API** : `/api/dashboard`
2. **Authentification** : Vérifier le token d'accès
3. **Récupération des données** : Depuis les tables Supabase
4. **Calculs** : Effectuer les calculs côté serveur
5. **Formatage** : Retourner les données formatées
6. **Cache** : Mettre en cache les données pour les performances

## 📝 **Notes Importantes**

- Tous les montants doivent être en **GNF** (Francs Guinéens)
- Les dates doivent être formatées en **français**
- Les couleurs des graphiques sont prédéfinies
- Les documents doivent avoir des URLs valides
- Les statistiques doivent être calculées en temps réel
