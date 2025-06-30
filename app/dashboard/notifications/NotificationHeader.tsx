import React from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationHeaderProps {
  unreadCount: number;
  onClose: () => void;
}

export default function NotificationHeader({ unreadCount, onClose }: NotificationHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[var(--zalama-border)]">
      <div className="flex items-center">
        <Bell className="w-5 h-5 text-[var(--zalama-blue)] mr-2" />
        <h2 className="text-lg font-semibold text-[var(--zalama-text)]">Notifications</h2>
        {unreadCount > 0 && (
          <span className="ml-2 bg-[var(--zalama-blue)] text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount} non lues
          </span>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]/70 transition-colors"
        aria-label="Fermer les notifications"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
