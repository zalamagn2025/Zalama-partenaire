import React from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationHeaderProps {
  unreadCount: number;
  onClose: () => void;
}

export default function NotificationHeader({ unreadCount, onClose }: NotificationHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
        {unreadCount > 0 && (
          <span className="ml-2 bg-blue-600 dark:bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount} non lues
          </span>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        aria-label="Fermer les notifications"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
