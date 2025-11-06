"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Search,
  Filter,
  BarChart3,
  FileCheck,
  BookOpen,
  Archive,
} from "lucide-react";
import { useRapports } from "@/hooks/useRapports";
import { RapportFilters, RapportCategorie, RapportType } from "@/types/rapport";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DocumentsRapportsProps {
  className?: string;
  compact?: boolean;
}

// Icônes et couleurs pour les types de fichiers
const getFileIcon = (type: RapportType) => {
  switch (type) {
    case "pdf":
      return FileText;
    case "xlsx":
      return FileSpreadsheet;
    case "docx":
      return File;
    default:
      return FileText;
  }
};

// Couleurs pour les icônes de fichiers
const getFileIconColor = (type: RapportType) => {
  switch (type) {
    case "pdf":
      return "text-red-500"; // Rouge pour PDF
    case "xlsx":
      return "text-green-500"; // Vert pour Excel
    case "docx":
      return "text-blue-500"; // Bleu pour Word
    default:
      return "text-gray-500";
  }
};

// Couleur de fond pour les icônes de fichiers
const getFileIconBgColor = (type: RapportType) => {
  switch (type) {
    case "pdf":
      return "bg-red-50 dark:bg-red-900/20"; // Fond rouge clair pour PDF
    case "xlsx":
      return "bg-green-50 dark:bg-green-900/20"; // Fond vert clair pour Excel
    case "docx":
      return "bg-blue-50 dark:bg-blue-900/20"; // Fond bleu clair pour Word
    default:
      return "bg-gray-50 dark:bg-gray-900/20";
  }
};

// Icônes pour les catégories
const getCategoryIcon = (categorie: RapportCategorie) => {
  switch (categorie) {
    case "releve":
      return BarChart3;
    case "rapport":
      return FileCheck;
    case "statistiques":
      return BarChart3;
    case "contrat":
      return FileText;
    case "guide":
      return BookOpen;
    case "autre":
      return Archive;
    default:
      return FileText;
  }
};

// Couleurs pour les catégories
const getCategoryColor = (categorie: RapportCategorie) => {
  switch (categorie) {
    case "releve":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "rapport":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "statistiques":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    case "contrat":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "guide":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300";
    case "autre":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function DocumentsRapports({
  className,
  compact = false,
}: DocumentsRapportsProps) {
  const [filters, setFilters] = useState<RapportFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const {
    rapports,
    stats,
    loading,
    error,
    downloadRapport,
    downloadAllRapports,
    formatFileSize,
  } = useRapports(filters);

  // Mise à jour des filtres
  const updateFilter = (key: keyof RapportFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Composant de loading
  if (loading) {
    return (
      <Card
        className={cn(
          "bg-[var(--zalama-card)] border-[var(--zalama-border)]",
          className
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <Card
        className={cn(
          "bg-[var(--zalama-card)] border-[var(--zalama-border)]",
          className
        )}
      >
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-red-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Erreur lors du chargement des documents</p>
            <p className="text-sm opacity-75">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-[var(--zalama-card)] border-[var(--zalama-border)]",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Documents et rapports
            {stats && (
              <Badge variant="default" className="ml-2">
                {stats.total}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center space-x-2">
            {!compact && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-[var(--zalama-border)]"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtres
              </Button>
            )}

            {/*  {rapports.length > 0 && (
              <Button
                onClick={downloadAllRapports}
                size="sm"
                className="bg-[var(--zalama-blue)] hover:bg-[var(--zalama-blue)]/90"
              >
                <Download className="w-4 h-4 mr-1" />
                Tout télécharger
              </Button>
            )} */}
          </div>
        </div>

        {/* Filtres */}
        {showFilters && !compact && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--zalama-border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={filters.searchTerm || ""}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                className="pl-10 border-[var(--zalama-border)]"
              />
            </div>

            <Select
              value={filters.categorie || "all"}
              onValueChange={(value) =>
                updateFilter("categorie", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="border-[var(--zalama-border)]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="releve">Relevés</SelectItem>
                <SelectItem value="rapport">Rapports</SelectItem>
                <SelectItem value="statistiques">Statistiques</SelectItem>
                <SelectItem value="contrat">Contrats</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
                <SelectItem value="autre">Autres</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type || "all"}
              onValueChange={(value) =>
                updateFilter("type", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="border-[var(--zalama-border)]">
                <SelectValue placeholder="Type de fichier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="docx">Word</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Date de création"
              value={filters.dateDebut || ""}
              onChange={(e) => updateFilter("dateDebut", e.target.value)}
              className="border-[var(--zalama-border)]"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {rapports.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun document disponible</p>
              {filters.searchTerm && (
                <p className="text-sm">
                  Essayez de modifier vos critères de recherche
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rapports.slice(0, compact ? 5 : undefined).map((rapport) => {
              const FileIcon = getFileIcon(rapport.type);
              const CategoryIcon = getCategoryIcon(rapport.categorie);

              return (
                <div
                  key={rapport.id}
                  className="flex items-center space-x-4 p-3 rounded-lg border border-[var(--zalama-border)] hover:bg-[var(--zalama-bg-light)] transition-colors"
                >
                  {/* Icône du fichier */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileIconBgColor(
                        rapport.type
                      )}`}
                    >
                      <FileIcon
                        className={`w-5 h-5 ${getFileIconColor(rapport.type)}`}
                      />
                    </div>
                    {/* Badge avec l'extension */}
                    <div
                      className={`absolute -top-1 -right-1 px-1 py-0.5 rounded text-xs font-bold text-white text-[9px] leading-none ${
                        rapport.type === "pdf"
                          ? "bg-red-500"
                          : rapport.type === "xlsx"
                          ? "bg-green-500"
                          : rapport.type === "docx"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {rapport.type.toUpperCase()}
                    </div>
                  </div>

                  {/* Informations du document */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-sm truncate">
                        {rapport.nom}
                      </h3>
                      <Badge
                        className={cn(
                          "text-xs",
                          getCategoryColor(rapport.categorie)
                        )}
                      >
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {rapport.categorie}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatFileSize(rapport.taille)}</span>
                      <span>
                        {new Date(rapport.date_creation).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>

                    {rapport.description && !compact && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                        {rapport.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => downloadRapport(rapport)}
                      className="bg-[var(--zalama-success)] hover:bg-[var(--zalama-success)]/90"
                    >
                      <Download className="w-4 h-4" />
                      {!compact && (
                        <span className="ml-1 hidden sm:inline">
                          Télécharger
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Lien pour voir plus en mode compact */}
            {compact && rapports.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="link"
                  className="text-[var(--zalama-blue)]"
                  onClick={() => router.push("/dashboard/documents")}
                >
                  Voir tous les documents ({rapports.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
