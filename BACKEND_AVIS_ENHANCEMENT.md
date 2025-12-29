# Amélioration de l'API Avis - Champs à ajouter

## Contexte
L'API `/avis` doit retourner les informations complètes de l'utilisateur/employé qui a créé l'avis pour éviter d'avoir à faire des requêtes supplémentaires côté frontend.

## Champs à ajouter dans la réponse de l'API `/avis`

### Pour chaque avis dans la liste (`GET /avis`)

Ajouter un objet `user` ou `employee` (selon votre structure) contenant :

```json
{
  "id": "uuid-de-l-avis",
  "note": 5,
  "commentaire": "Excellent service !",
  "typeRetour": "positif",
  "approuve": true,
  "dateAvis": "2024-01-15T10:30:00Z",
  "userId": "uuid-de-l-utilisateur",
  "partnerId": "uuid-du-partenaire",
  "user": {
    "id": "uuid-de-l-utilisateur",
    "email": "user@example.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "telephone": "622123456"
  },
  "employee": {
    "id": "uuid-de-l-employe",
    "nom": "Nom",
    "prenom": "Prénom",
    "email": "employee@example.com",
    "telephone": "622123456",
    "poste": "Développeur",
    "photoUrl": "https://example.com/photo.jpg",
    "photo_url": "https://example.com/photo.jpg"
  }
}
```

### Champs spécifiques requis dans l'objet `user` ou `employee` :

1. **email** (string, optionnel) - Email de l'utilisateur/employé
2. **telephone** (string, optionnel) - Numéro de téléphone de l'utilisateur/employé
3. **nom** (string) - Nom de famille
4. **prenom** (string) - Prénom
5. **poste** (string, optionnel) - Poste de l'employé
6. **photoUrl** ou **photo_url** (string, optionnel) - URL de la photo de profil

### Notes importantes :

- Si l'utilisateur n'est pas un employé, utiliser l'objet `user`
- Si l'utilisateur est un employé, utiliser l'objet `employee` avec les champs spécifiques aux employés
- Les champs optionnels peuvent être `null` ou omis s'ils ne sont pas disponibles
- Le champ `telephone` doit être retourné tel quel (sans le préfixe +224, le frontend l'ajoutera)

### Exemple de réponse complète :

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "note": 5,
      "commentaire": "Excellent service !",
      "typeRetour": "positif",
      "approuve": true,
      "dateAvis": "2024-01-15T10:30:00Z",
      "userId": "456e7890-e89b-12d3-a456-426614174001",
      "partnerId": "789e0123-e89b-12d3-a456-426614174002",
      "employee": {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "622123456",
        "poste": "Développeur Senior",
        "photoUrl": "https://example.com/photos/jean-dupont.jpg"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Routes concernées :

- `GET /avis` - Liste des avis
- `GET /avis/{id}` - Détails d'un avis spécifique

Ces deux routes doivent retourner les mêmes informations enrichies avec les données de l'utilisateur/employé.


