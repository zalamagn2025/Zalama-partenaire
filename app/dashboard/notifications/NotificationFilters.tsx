import React from 'react';
import { Filter, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface NotificationFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function NotificationFilters({ currentFilter, onFilterChange }: NotificationFiltersProps) {
  const filters = [
    { id: 'all', label: 'Toutes', icon: Filter },
    { id: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
    { id: 'success', label: 'Succès', icon: CheckCircle, color: 'text-green-500' },
    { id: 'warning', label: 'Avertissement', icon: AlertTriangle, color: 'text-amber-500' },
    { id: 'error', label: 'Erreur', icon: AlertCircle, color: 'text-red-500' }
  ];

  return (
    <div className="p-2 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/50">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => {
          const isActive = currentFilter === filter.id;
          const Icon = filter.icon;
          
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-all border ${
                isActive 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700' 
                  : 'text-[var(--zalama-text)]/70 hover:bg-[var(--zalama-bg-light)] hover:text-[var(--zalama-text)] hover:border-orange-300 dark:hover:border-orange-700 border-transparent'
              }`}
              style={{ height: '2rem', lineHeight: '1' }}
            >
              <Icon className={`w-4 h-4 mr-1.5 flex-shrink-0 ${filter.color || ''}`} style={{ lineHeight: '1' }} />
              <span className="flex-shrink-0" style={{ lineHeight: '1' }}>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
