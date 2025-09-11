# Flux de Rejet des Inscriptions d'Employés

## Diagramme de Flux

```mermaid
graph TD
    A[RH accède à la page Demandes d'Adhésion] --> B[Liste des employés sans compte]
    B --> C{RH clique sur "Rejeter"}
    C --> D[Ouverture du modal de confirmation]
    D --> E[RH saisit le motif optionnel]
    E --> F{RH confirme le rejet}
    F -->|Oui| G[Appel Edge Function /reject]
    F -->|Non| H[Annulation - Fermeture modal]

    G --> I{Edge Function valide}
    I -->|Succès| J[Suppression de l'employé de la liste]
    I -->|Erreur| K[Affichage message d'erreur]

    J --> L[Envoi notifications]
    L --> M[Email à l'employé]
    L --> N[SMS à l'employé]
    L --> O[Email au partenaire]
    L --> P[Notification admin en BD]

    M --> Q[Toast de succès]
    N --> Q
    O --> Q
    P --> Q

    K --> R[Toast d'erreur]

    H --> B
    Q --> B
    R --> B
```

## États de l'Interface

```mermaid
stateDiagram-v2
    [*] --> ListeEmployes
    ListeEmployes --> ModalConfirmation : Clic "Rejeter"
    ModalConfirmation --> Traitement : Confirmation
    ModalConfirmation --> ListeEmployes : Annulation
    Traitement --> Succes : Edge Function OK
    Traitement --> Erreur : Edge Function KO
    Succes --> ListeEmployes : Employé supprimé
    Erreur --> ListeEmployes : Message d'erreur
```

## Architecture Technique

```mermaid
graph LR
    A[Interface React] --> B[edgeFunctionService]
    B --> C[Edge Function partner-employees]
    C --> D[Base de données Supabase]
    C --> E[Service Email]
    C --> F[Service SMS]
    C --> G[Notifications Admin]

    subgraph "Frontend"
        A
        B
    end

    subgraph "Backend"
        C
        D
        E
        F
        G
    end
```

## Gestion des Erreurs

```mermaid
graph TD
    A[Appel Edge Function] --> B{Status Code}
    B -->|200| C[Succès - Employé rejeté]
    B -->|400| D[Erreur - Données invalides]
    B -->|401| E[Erreur - Non autorisé]
    B -->|404| F[Erreur - Employé non trouvé]
    B -->|500| G[Erreur - Serveur]

    C --> H[Suppression de la liste]
    D --> I[Toast: Données invalides]
    E --> J[Toast: Session expirée]
    F --> K[Toast: Employé non trouvé]
    G --> L[Toast: Erreur serveur]

    H --> M[Notifications envoyées]
    I --> N[Retour à la liste]
    J --> N
    K --> N
    L --> N
```

## Séquence d'Appel API

```mermaid
sequenceDiagram
    participant RH as Responsable RH
    participant UI as Interface Utilisateur
    participant API as Edge Function
    participant DB as Base de Données
    participant EMAIL as Service Email
    participant SMS as Service SMS

    RH->>UI: Clic "Rejeter"
    UI->>UI: Ouverture modal confirmation
    RH->>UI: Saisie motif + Confirmation
    UI->>API: POST /reject {employee_id, reason}
    API->>DB: Vérification employé
    DB-->>API: Données employé
    API->>DB: Suppression employé
    API->>EMAIL: Envoi notification
    API->>SMS: Envoi notification
    API-->>UI: Réponse succès
    UI->>UI: Suppression de la liste
    UI->>RH: Toast de succès
```
