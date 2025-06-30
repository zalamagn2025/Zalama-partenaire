import React from 'react';
import { Check, Trash2 } from 'lucide-react';

interface NotificationFooterProps {
  onMarkAllAsRead: () => void;
}

export default function NotificationFooter({ onMarkAllAsRead }: NotificationFooterProps) {
  return (
    <div className="p-3 border-t border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/50">
      <div className="flex items-center justify-between">
        <button
          onClick={onMarkAllAsRead}
          className="flex items-center px-3 py-1.5 rounded-md text-sm text-[var(--zalama-text)]/70 hover:bg-[var(--zalama-bg-light)] hover:text-[var(--zalama-text)] transition-colors"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Tout marquer comme lu
        </button>
        <button
          className="flex items-center px-3 py-1.5 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Effacer l&apos;historique
        </button>
      </div>
    </div>
  );
}
