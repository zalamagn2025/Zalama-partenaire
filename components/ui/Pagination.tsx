"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div
      className={`bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg px-4 py-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Informations sur les éléments */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--zalama-text-secondary)]">
            {totalItems === 0
              ? "Aucun élément"
              : totalItems === 1
              ? "1 élément"
              : `${startItem}-${endItem} sur ${totalItems} éléments`}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {/* Bouton Précédent */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 border-[var(--zalama-border)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)] hover:text-[var(--zalama-blue)] disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Numéros de pages */}
          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="px-2 py-1 text-[var(--zalama-text-secondary)]"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <Button
                  key={pageNumber}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className={`h-8 w-8 p-0 ${
                    isActive
                      ? "bg-[var(--zalama-blue)] text-white hover:bg-[var(--zalama-blue-accent)]"
                      : "border-[var(--zalama-border)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)] hover:text-[var(--zalama-blue)]"
                  }`}
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          {/* Bouton Suivant */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 border-[var(--zalama-border)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)] hover:text-[var(--zalama-blue)] disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
