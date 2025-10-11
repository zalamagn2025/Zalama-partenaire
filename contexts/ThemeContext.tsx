"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 🚫 TEMPORAIRE : Désactiver le thème blanc - forcer le thème sombre
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // 🚫 TEMPORAIRE : Forcer le thème sombre uniquement
    setTheme('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    
    // 🚫 TEMPORAIRE : Ignorer localStorage et préférences système
    /*
    // Vérifier si un thème est déjà enregistré dans localStorage
    const savedTheme = localStorage.getItem('zalama-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      // Ajouter ou supprimer la classe dark pour la compatibilité avec Tailwind
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Utiliser les préférences du système si aucun thème n'est enregistré
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
      // Ajouter ou supprimer la classe dark pour la compatibilité avec Tailwind
      if (defaultTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    */
  }, []);

  const toggleTheme = () => {
    // 🚫 TEMPORAIRE : Désactiver le toggle - rester en mode sombre
    console.log('🚫 Thème blanc temporairement désactivé - rester en mode sombre');
    return;
    
    /*
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('zalama-theme', newTheme);
    
    // Ajouter ou supprimer la classe dark pour la compatibilité avec Tailwind
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    */
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
