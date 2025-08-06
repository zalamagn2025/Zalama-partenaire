"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DocumentsRapports from "@/components/dashboard/DocumentsRapports";
import { useRapports } from "@/hooks/useRapports";
import { FileText, BarChart3, Calendar, HardDrive } from "lucide-react";

export default function DocumentsPage() {
  const { stats, formatFileSize } = useRapports();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents et Rapports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Consultez et téléchargez tous vos documents administratifs
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Documents
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Taille Totale
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatFileSize(stats.taille_totale)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Rapports
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.par_categorie.rapport +
                      stats.par_categorie.statistiques}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Dernière MAJ
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.derniere_creation
                      ? new Date(stats.derniere_creation).toLocaleDateString(
                          "fr-FR"
                        )
                      : "N/A"}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Répartition par catégorie */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
            <CardHeader>
              <CardTitle className="text-lg">
                Répartition par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.par_categorie).map(
                  ([categorie, count]) =>
                    count > 0 && (
                      <div
                        key={categorie}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="capitalize">
                            {categorie}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    )
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
            <CardHeader>
              <CardTitle className="text-lg">Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.par_type).map(
                  ([type, count]) =>
                    count > 0 && (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={
                              type === "pdf"
                                ? "bg-red-100 text-red-700"
                                : type === "xlsx"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {type.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste complète des documents */}
      <DocumentsRapports />
    </div>
  );
}
