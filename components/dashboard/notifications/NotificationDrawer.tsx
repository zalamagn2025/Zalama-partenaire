"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useEdgeAuthContext } from '@/contexts/EdgeAuthContext';
import { Notification } from './types';
import NotificationHeader from './NotificationHeader';
import NotificationList from './NotificationList';
import NotificationFilters from './NotificationFilters';
import NotificationFooter from './NotificationFooter';
import { toast } from 'sonner';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { session } = useEdgeAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Charger les notifications filtrées par user_id (admin connecté)
  const loadNotifications = async () => {
    if (!session?.admin?.id) {
      console.log('Pas de session admin disponible pour charger les notifications');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/proxy/notifications?user_id=${session.admin.id}&limit=20`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const notifList: Notification[] = data.data.map((notif: any) => ({
          id: notif.id,
          title: notif.titre,
          message: notif.message,
          type: notif.type,
          timestamp: new Date(notif.date_creation),
          read: notif.lu,
          link: undefined
        }));
        setNotifications(notifList);
      } else {
        console.error('Format de données inattendu:', data);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error(`Erreur lors du chargement des notifications: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les notifications au montage et quand la session change
  useEffect(() => {
    if (session?.admin?.id) {
      loadNotifications();
    }
  }, [session?.admin?.id]);

  // Recharger les notifications quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen && session?.admin?.id) {
      loadNotifications();
    }
  }, [isOpen, session?.admin?.id]);
  
  // Fermer le drawer si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Empêcher le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  // Obtenir le nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };
  
  // Marquer une notification comme lue
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Filtrer les notifications
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(notification => notification.type === filter);
  
  return (
    <>
      {/* Overlay sombre */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[var(--zalama-card)] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* En-tête */}
          <NotificationHeader 
            unreadCount={unreadCount} 
            onClose={onClose} 
          />
          
          {/* Filtres */}
          <NotificationFilters 
            currentFilter={filter} 
            onFilterChange={setFilter} 
          />
          
          {/* Liste des notifications */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Chargement des notifications...
              </span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Aucune notification pour le moment
              </span>
            </div>
          ) : (
            <NotificationList 
              notifications={filteredNotifications} 
              onMarkAsRead={markAsRead} 
            />
          )}
          
          {/* Pied de page */}
          <NotificationFooter 
            onMarkAllAsRead={markAllAsRead} 
          />
        </div>
      </div>
    </>
  );
}
