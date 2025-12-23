import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Hook pour synchroniser les filtres avec les query parameters de l'URL
 * 
 * @param filters - Objet contenant les filtres actuels
 * @param options - Options de configuration
 * @returns Fonction pour mettre à jour un filtre
 */
export function useUrlFilters<T extends Record<string, any>>(
  filters: T,
  options?: {
    // Exclure certains filtres de l'URL (ex: showFilters, isModalOpen)
    exclude?: string[];
    // Préfixe pour les paramètres (optionnel)
    prefix?: string;
  }
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Exclure les filtres qui ne doivent pas être dans l'URL
  const excludeKeys = options?.exclude || [];
  const prefix = options?.prefix || '';

  // Fonction pour mettre à jour un filtre dans l'URL
  const updateFilter = useCallback((key: keyof T, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    const paramKey = prefix ? `${prefix}_${String(key)}` : String(key);

    // Si la valeur est null, undefined, ou chaîne vide, supprimer le paramètre
    if (value === null || value === undefined || value === '' || value === 'all') {
      params.delete(paramKey);
    } else {
      params.set(paramKey, String(value));
    }

    // Mettre à jour l'URL sans recharger la page
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, prefix]);

  // Fonction pour mettre à jour plusieurs filtres en même temps
  const updateFilters = useCallback((updates: Partial<T>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (excludeKeys.includes(key)) return;
      
      const paramKey = prefix ? `${prefix}_${key}` : key;

      if (value === null || value === undefined || value === '' || value === 'all') {
        params.delete(paramKey);
      } else {
        params.set(paramKey, String(value));
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, prefix, excludeKeys]);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    router.push(window.location.pathname, { scroll: false });
  }, [router]);

  // Fonction pour lire un filtre depuis l'URL
  const getFilterFromUrl = useCallback((key: keyof T, defaultValue?: any): any => {
    const paramKey = prefix ? `${prefix}_${String(key)}` : String(key);
    const value = searchParams.get(paramKey);
    
    if (value === null) return defaultValue;
    
    // Essayer de parser comme nombre si c'est un nombre
    if (!isNaN(Number(value)) && value !== '') {
      return Number(value);
    }
    
    // Essayer de parser comme booléen
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    return value;
  }, [searchParams, prefix]);

  // Fonction pour initialiser les filtres depuis l'URL
  const initializeFiltersFromUrl = useCallback((defaultFilters: T): T => {
    const initialized = { ...defaultFilters };
    
    Object.keys(defaultFilters).forEach((key) => {
      if (excludeKeys.includes(key)) return;
      
      const urlValue = getFilterFromUrl(key as keyof T);
      if (urlValue !== null && urlValue !== undefined) {
        (initialized as any)[key] = urlValue;
      }
    });
    
    return initialized;
  }, [getFilterFromUrl, excludeKeys]);

  return {
    updateFilter,
    updateFilters,
    resetFilters,
    getFilterFromUrl,
    initializeFiltersFromUrl,
  };
}

/**
 * Hook simplifié pour synchroniser un seul filtre avec l'URL
 */
export function useUrlFilter<T>(
  key: string,
  defaultValue: T,
  options?: {
    prefix?: string;
  }
): [T, (value: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefix = options?.prefix || '';
  const paramKey = prefix ? `${prefix}_${key}` : key;

  const value = useMemo(() => {
    const urlValue = searchParams.get(paramKey);
    
    if (urlValue === null) return defaultValue;
    
    // Essayer de parser comme nombre si c'est un nombre
    if (!isNaN(Number(urlValue)) && urlValue !== '') {
      return Number(urlValue) as T;
    }
    
    // Essayer de parser comme booléen
    if (urlValue === 'true') return true as T;
    if (urlValue === 'false') return false as T;
    
    return urlValue as T;
  }, [searchParams, paramKey, defaultValue]);

  const setValue = useCallback((newValue: T) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newValue === null || newValue === undefined || newValue === '' || newValue === 'all') {
      params.delete(paramKey);
    } else {
      params.set(paramKey, String(newValue));
    }

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, paramKey]);

  return [value, setValue];
}

