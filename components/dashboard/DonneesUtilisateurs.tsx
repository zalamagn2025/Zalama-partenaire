import React from 'react';
import { Star } from 'lucide-react';

export default function DonneesUtilisateurs() {
  return (
    <div>
        <h2 className="text-xl font-semibold mb-4 text-[var(--zalama-blue)]">Données utilisateurs</h2>
        <div className="flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-[var(--zalama-text)]">Répartition par âge, sexe, région</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[var(--zalama-text)]">18-25 ans</span>
                </div>
                <div className="w-full bg-[var(--zalama-bg-light)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--zalama-blue)] h-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[var(--zalama-text)]">26-40 ans</span>
                </div>
                <div className="w-full bg-[var(--zalama-bg-light)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--zalama-blue)] h-full" style={{ width: '90%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[var(--zalama-text)]">(en idhnk balanæ et</span>
                </div>
                <div className="w-full bg-[var(--zalama-bg-light)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--zalama-blue)] h-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[var(--zalama-text)]">pensionnes)</span>
                </div>
                <div className="w-full bg-[var(--zalama-bg-light)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--zalama-blue)] h-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2 text-[var(--zalama-text)]">Localisation géographique</h3>
            <div className="relative h-32 w-full bg-[var(--zalama-bg-light)] rounded-lg overflow-hidden">
              {/* Carte simplifiée de l'Afrique comme sur l'image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="h-full w-full">
                  <path d="M80,40 C100,30 120,30 140,40 C150,60 160,80 150,100 C140,120 130,140 120,160 C100,170 80,170 60,160 C50,140 40,120 50,100 C60,80 70,60 80,40 Z" fill="#60a5fa" opacity="0.6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <div className="text-2xl font-bold text-[var(--zalama-text)]">4,7</div>
            <div className="text-sm text-[var(--zalama-text-secondary)]">stars</div>
            <div className="flex ml-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-[var(--zalama-blue)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
