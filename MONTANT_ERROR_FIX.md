# Correction de l'erreur "Cannot read properties of undefined (reading 'toLocaleString')"

## Problème identifié

L'application générait une erreur runtime :
```
Error: Cannot read properties of undefined (reading 'toLocaleString')
app\dashboard\demandes\page.tsx (764:42)
```

Cette erreur se produisait car `demande.montant` était `undefined` dans certaines données.

## Cause du problème

Le mapping des données ne correspondait pas à la structure retournée par l'edge function `partner-salary-demands`. L'edge function retourne une structure différente avec :

- `montant_total_demande` au lieu de `montant_demande`
- `employe` au lieu de `employee` ou `employees`
- `demandes_detailes` avec des détails supplémentaires
- `statut_global` pour le statut global

## Solution implémentée

### 1. Correction du mapping des données

**Fichier modifié :** `app/dashboard/demandes/page.tsx`

#### Avant (incorrect) :
```typescript
const allDemandes = demandesAvance.map((d) => ({
  ...d,
  demandeur: (d as any).employee ? `${(d as any).employee.prenom} ${(d as any).employee.nom}` : ...,
  montant: d.montant_demande, // ❌ Peut être undefined
  // ...
}));
```

#### Après (correct) :
```typescript
const allDemandes = demandesAvance.map((d) => {
  // Gérer la structure de données de l'edge function
  const employe = (d as any).employe || (d as any).employee || d.employees;
  const demandesDetailes = (d as any).demandes_detailes || [];
  const premiereDemande = demandesDetailes[0] || {};
  
  return {
    ...d,
    demandeur: employe ? `${employe.prenom || ''} ${employe.nom || ''}`.trim() : `Employé ${d.employe_id}`,
    montant: (d as any).montant_total_demande || premiereDemande.montant_demande || d.montant_demande || 0, // ✅ Valeur par défaut
    statut: (d as any).statut_global || premiereDemande.statut || d.statut || "Non défini",
    type_motif: premiereDemande.type_motif || d.type_motif || "Autre",
    // ...
  };
});
```

### 2. Protection contre les valeurs undefined

#### Ajout d'une vérification de sécurité :
```typescript
// Avant (vulnérable)
{demande.montant.toLocaleString()} GNF

// Après (sécurisé)
{(demande.montant || 0).toLocaleString()} GNF
```

### 3. Amélioration de la gestion des statuts

#### Support des nouveaux statuts :
```typescript
className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
  demande.statut === "En attente" || demande.statut === "En attente RH/Responsable"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : demande.statut === "Validé"
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    : demande.statut === "Rejeté"
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
}`}
```

## Structure de données supportée

La correction prend maintenant en charge la structure complète de l'edge function :

```json
{
  "employe_id": "...",
  "partenaire_id": "...",
  "categorie": "mono-mois|multi-mois",
  "employe": {
    "id": "...",
    "nom": "...",
    "prenom": "...",
    "email": "...",
    "telephone": "...",
    "salaire_net": 1666667
  },
  "montant_total_demande": 1500000,
  "statut_global": "En attente RH/Responsable|Validé|Rejeté",
  "demandes_detailes": [
    {
      "montant_demande": 1500000,
      "statut": "En attente RH/Responsable",
      "type_motif": "sante",
      "motif": "Urgence médicale",
      "num_installments": 3
    }
  ]
}
```

## Résultat

✅ **Plus d'erreur runtime** sur `toLocaleString()`
✅ **Affichage correct des montants** avec valeur par défaut de 0
✅ **Support complet** de la structure de l'edge function
✅ **Gestion des statuts** "En attente RH/Responsable"
✅ **Affichage des catégories** mono-mois/multi-mois
✅ **Robustesse** contre les données manquantes

L'application peut maintenant afficher correctement toutes les données des demandes de salaire sans erreur ! 🎉
