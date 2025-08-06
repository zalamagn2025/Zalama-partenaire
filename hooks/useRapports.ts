"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Rapport, RapportFilters, RapportStats } from "@/types/rapport";
import { toast } from "sonner";

export function useRapports(filters?: RapportFilters) {
  const { session } = useAuth();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [stats, setStats] = useState<RapportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les rapports
  const loadRapports = async () => {
    if (!session?.partner?.id) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("rapports")
        .select("*")
        .eq("partenaire_id", session.partner.id)
        .eq("statut", "actif")
        .order("date_creation", { ascending: false });

      // Appliquer les filtres
      if (filters?.categorie) {
        query = query.eq("categorie", filters.categorie);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.dateDebut) {
        query = query.gte("date_creation", filters.dateDebut);
      }
      if (filters?.dateFin) {
        query = query.lte("date_creation", filters.dateFin);
      }
      if (filters?.searchTerm) {
        query = query.or(
          `nom.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setRapports(data || []);

      // Calculer les statistiques
      if (data) {
        calculateStats(data);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des rapports:", err);
      setError(err.message);
      toast.error("Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (data: Rapport[]) => {
    const stats: RapportStats = {
      total: data.length,
      par_categorie: {
        releve: 0,
        rapport: 0,
        statistiques: 0,
        contrat: 0,
        guide: 0,
        autre: 0,
      },
      par_type: {
        pdf: 0,
        xlsx: 0,
        docx: 0,
      },
      taille_totale: 0,
      derniere_creation: "",
    };

    data.forEach((rapport) => {
      stats.par_categorie[rapport.categorie]++;
      stats.par_type[rapport.type]++;
      stats.taille_totale += rapport.taille;
    });

    if (data.length > 0) {
      stats.derniere_creation = data[0].date_creation;
    }

    setStats(stats);
  };

  // Prévisualiser un rapport
  const previewRapport = async (rapport: Rapport) => {
    try {
      if (rapport.url_download) {
        // Ouvrir dans un nouvel onglet
        window.open(rapport.url_download, "_blank");
      } else if (rapport.chemin_storage) {
        // Générer l'URL publique depuis Supabase Storage
        const { data } = supabase.storage
          .from("rapports")
          .getPublicUrl(rapport.chemin_storage);

        if (data?.publicUrl) {
          window.open(data.publicUrl, "_blank");
        } else {
          toast.error("Impossible de prévisualiser ce document");
        }
      } else {
        toast.error("Aucun lien de prévisualisation disponible");
      }
    } catch (err) {
      console.error("Erreur lors de la prévisualisation:", err);
      toast.error("Erreur lors de la prévisualisation");
    }
  };

  // Télécharger un rapport
  const downloadRapport = async (rapport: Rapport) => {
    try {
      let downloadUrl = rapport.url_download;

      // Si pas d'URL de téléchargement, utiliser Supabase Storage
      if (!downloadUrl && rapport.chemin_storage) {
        const { data } = supabase.storage
          .from("rapports")
          .getPublicUrl(rapport.chemin_storage);

        downloadUrl = data?.publicUrl;
      }

      if (!downloadUrl) {
        toast.error("Aucun lien de téléchargement disponible");
        return;
      }

      // Créer un lien de téléchargement
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = rapport.nom_fichier || rapport.nom;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Document "${rapport.nom}" téléchargé`);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      toast.error("Erreur lors du téléchargement");
    }
  };

  // Télécharger tous les rapports
  const downloadAllRapports = async () => {
    try {
      toast.info("Préparation du téléchargement de tous les documents...");

      for (const rapport of rapports) {
        await downloadRapport(rapport);
        // Petit délai pour éviter de surcharger le navigateur
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast.success(`${rapports.length} documents téléchargés`);
    } catch (err) {
      console.error("Erreur lors du téléchargement groupé:", err);
      toast.error("Erreur lors du téléchargement groupé");
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    if (session?.partner?.id) {
      loadRapports();
    }
  }, [session?.partner?.id, filters]);

  return {
    rapports,
    stats,
    loading,
    error,
    previewRapport,
    downloadRapport,
    downloadAllRapports,
    formatFileSize,
    refresh: loadRapports,
  };
}
