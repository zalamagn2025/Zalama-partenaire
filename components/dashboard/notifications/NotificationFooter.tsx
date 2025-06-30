import React from 'react';
import { Check, Trash2 } from 'lucide-react';

interface NotificationFooterProps {
  onMarkAllAsRead: () => void;
}

export default function NotificationFooter({ onMarkAllAsRead }: NotificationFooterProps) {
  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between">
        <button
          onClick={onMarkAllAsRead}
          className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Tout marquer comme lu
        </button>
        <button
          className="flex items-center px-3 py-1.5 rounded-md text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Effacer l&apos;historique
        </button>
      </div>
    </div>
  );
}
