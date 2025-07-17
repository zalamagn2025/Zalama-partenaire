import React from 'react';
import { Notification, NotificationType } from './types';
import { CheckCircle, AlertTriangle, Info, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
}

export default function NotificationList({ notifications, onMarkAsRead }: NotificationListProps) {
  // Fonction pour formater la date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };
  
  // Fonction pour obtenir l'icône selon le type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-1" style={{scrollbarWidth: 'none'}}>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <Info className="w-12 h-12 mb-2" />
          <p className="text-lg font-medium">Aucune notification</p>
          <p className="text-sm">Vous n&apos;avez aucune notification pour le moment</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {notifications.map((notification) => (
            <li 
              key={notification.id} 
              className={`p-3 rounded-lg transition-colors ${
                notification.read 
                  ? 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          aria-label="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {notification.message}
                  </p>
                  {notification.link && (
                    <Link 
                      href={notification.link}
                      className="inline-block mt-2 text-xs font-medium text-[var(--zalama-blue)] hover:underline"
                    >
                      Voir les détails
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
