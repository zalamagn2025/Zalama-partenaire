"use client";

import { useEffect, useState } from 'react';

/**
 * Hook pour détecter si l'appareil est un mobile basé sur la largeur de l'écran
 * @param breakpoint Largeur en pixels en dessous de laquelle on considère l'appareil comme mobile (défaut: 768px)
 * @returns Boolean indiquant si l'appareil est considéré comme mobile
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Fonction pour vérifier la taille de l'écran
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Vérifier au chargement initial
    checkMobile();

    // Ajouter un écouteur d'événement pour les changements de taille d'écran
    window.addEventListener('resize', checkMobile);

    // Nettoyer l'écouteur d'événement lors du démontage du composant
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
