export interface Rapport {
  id: string;
  nom: string;
  type: "pdf" | "xlsx" | "docx";
  taille: number;
  partenaire_id: string;
  date_creation: string;
  date_expiration?: string;
  statut: "actif" | "expire" | "supprime";
  url_download?: string;
  description?: string;
  categorie:
    | "releve"
    | "rapport"
    | "statistiques"
    | "contrat"
    | "guide"
    | "autre";
  nom_fichier?: string;
  created_at: string;
  updated_at: string;
  chemin_storage?: string;
}

export interface RapportWithStats extends Rapport {
  downloads_count?: number;
  last_downloaded?: string;
}

export type RapportCategorie =
  | "releve"
  | "rapport"
  | "statistiques"
  | "contrat"
  | "guide"
  | "autre";
export type RapportType = "pdf" | "xlsx" | "docx";
export type RapportStatut = "actif" | "expire" | "supprime";

export interface RapportFilters {
  categorie?: RapportCategorie;
  type?: RapportType;
  statut?: RapportStatut;
  dateDebut?: string;
  dateFin?: string;
  searchTerm?: string;
}

export interface RapportStats {
  total: number;
  par_categorie: Record<RapportCategorie, number>;
  par_type: Record<RapportType, number>;
  taille_totale: number;
  derniere_creation: string;
}
