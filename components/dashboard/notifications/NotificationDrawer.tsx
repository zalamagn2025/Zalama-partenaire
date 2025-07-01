"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Charger les notifications filtrées par partenaire
  const loadNotifications = async () => {
    if (!session?.partner?.id) return;
    
    setLoading(true);
    try {
      // Récupérer les alertes (sans filtrage par partenaire pour l'instant car la table n'a pas cette colonne)
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .order('date_creation', { ascending: false })
        .limit(10);

      if (alertsError) {
        console.error('Erreur lors du chargement des alertes:', alertsError);
      }

      // Récupérer les messages adressés à ce partenaire (en utilisant le nom du partenaire)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('destinataire', session.partner.nom)
        .eq('lu', false)
        .order('date_envoi', { ascending: false })
        .limit(10);

      if (messagesError) {
        console.error('Erreur lors du chargement des messages:', messagesError);
      }

      // Convertir les alertes en notifications
      const alertNotifications: Notification[] = (alerts || []).map((alert, index) => ({
        id: index + 1,
        title: alert.titre || 'Alerte',
        message: alert.description || '',
        type: alert.type?.toLowerCase() === 'critique' ? 'error' : 
              alert.type?.toLowerCase() === 'importante' ? 'warning' : 'info',
        timestamp: new Date(alert.date_creation),
        read: alert.statut === 'Résolue',
        link: `/dashboard/alertes`
      }));

      // Convertir les messages en notifications
      const messageNotifications: Notification[] = (messages || []).map((message, index) => ({
        id: alertNotifications.length + index + 1,
        title: `Nouveau message: ${message.sujet}`,
        message: message.contenu?.substring(0, 100) + '...' || '',
        type: message.priorite?.toLowerCase() === 'urgente' ? 'warning' : 'info',
        timestamp: new Date(message.date_envoi),
        read: message.lu,
        link: `/dashboard/messages`
      }));

      // Combiner toutes les notifications et les trier par date
      const allNotifications = [...alertNotifications, ...messageNotifications]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Charger les notifications au montage et quand la session change
  useEffect(() => {
    if (session?.partner?.id) {
      loadNotifications();
    }
  }, [session?.partner?.id]);

  // Recharger les notifications quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen && session?.partner?.id) {
      loadNotifications();
    }
  }, [isOpen, session?.partner?.id]);
  
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
