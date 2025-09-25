# Proxy pour l'Edge Function Partner Salary Demands

## Vue d'ensemble

Ce document décrit l'utilisation des proxies créés pour l'edge function `partner-salary-demands`. Ces proxies permettent d'accéder à toutes les fonctionnalités de l'edge function depuis le frontend.

## Routes disponibles

### 1. Demandes principales - `/api/proxy/demandes`

**GET** - Récupérer les demandes de salaire
- **URL**: `/api/proxy/demandes`
- **Filtres disponibles**:
  - `mois`: numéro du mois (1-12)
  - `annee`: année (ex: 2024)
  - `status`: EN_ATTENTE, APPROUVE, REJETE
  - `employe_id`: ID de l'employé
  - `type_motif`: type de motif (URGENCE_MEDICALE, EDUCATION, etc.)
  - `date_debut`: date de début (YYYY-MM-DD)
  - `date_fin`: date de fin (YYYY-MM-DD)
  - `categorie`: mono-mois, multi-mois
  - `statut_remboursement`: SANS_REMBOURSEMENT, EN_ATTENTE, PAYE, EN_RETARD, ANNULE
  - `limit`: nombre maximum de résultats
  - `offset`: décalage pour la pagination

**POST** - Créer une nouvelle demande de salaire
- **Body**:
  ```json
  {
    "employe_id": "string",
    "montant_demande": number,
    "motif": "string",
    "type_motif": "string",
    "num_installments": number
  }
  ```

### 2. Statistiques - `/api/proxy/demandes-statistics`

**GET** - Récupérer les statistiques des demandes
- **URL**: `/api/proxy/demandes-statistics`
- **Filtres disponibles**: mêmes que pour les demandes (sauf limit/offset)

### 3. Employés - `/api/proxy/demandes-employees`

**GET** - Récupérer la liste des employés
- **URL**: `/api/proxy/demandes-employees`
- **Aucun filtre requis**

### 4. Périodes d'activité - `/api/proxy/demandes-activity-periods`

**GET** - Récupérer les périodes d'activité
- **URL**: `/api/proxy/demandes-activity-periods`
- **Aucun filtre requis**

### 5. Mise à jour de demande - `/api/proxy/demandes/[id]`

**PUT** - Mettre à jour une demande de salaire
- **URL**: `/api/proxy/demandes/{id}`
- **Body**:
  ```json
  {
    "montant_demande": number,
    "motif": "string",
    "type_motif": "string",
    "commentaire_partenaire": "string",
    "num_installments": number
  }
  ```

## Exemples d'utilisation

### Récupérer toutes les demandes
```javascript
const response = await fetch('/api/proxy/demandes', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Filtrer par mois et statut
```javascript
const response = await fetch('/api/proxy/demandes?mois=9&status=APPROUVE', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Récupérer les statistiques avec filtres
```javascript
const response = await fetch('/api/proxy/demandes-statistics?annee=2024&categorie=multi-mois', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Créer une nouvelle demande
```javascript
const response = await fetch('/api/proxy/demandes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    employe_id: "a0e122ab-3c36-486c-918d-2b3b3f5d12b5",
    montant_demande: 500000,
    motif: "Urgence médicale",
    type_motif: "URGENCE_MEDICALE",
    num_installments: 1
  })
});
```

### Mettre à jour une demande
```javascript
const response = await fetch('/api/proxy/demandes/demande-id', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    montant_demande: 600000,
    motif: "Urgence médicale mise à jour",
    commentaire_partenaire: "Urgence confirmée par l'employé"
  })
});
```

## Données retournées

Toutes les réponses incluent :
- `success`: boolean
- `message`: string
- `data`: objet ou tableau contenant les données
- `total`: nombre total d'éléments (pour les listes)
- `filtres_appliques`: objet contenant les filtres appliqués

## Gestion des erreurs

Les proxies gèrent automatiquement :
- L'authentification (token requis)
- La validation des paramètres
- Le forwarding des erreurs de l'edge function
- Les erreurs de réseau et de parsing

En cas d'erreur, la réponse contient :
- `success`: false
- `message`: description de l'erreur
- `details`: détails supplémentaires de l'erreur
