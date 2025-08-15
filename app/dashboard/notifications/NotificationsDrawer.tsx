"use client";

import React, { useEffect, useRef } from "react";
import {} from "lucide-react";
import { getNotifications } from "./notificationService";
import { Notification } from "./types";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import NotificationHeader from "./NotificationHeader";
import NotificationList from "./NotificationList";
import NotificationFilters from "./NotificationFilters";
import NotificationFooter from "./NotificationFooter";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({
  isOpen,
  onClose,
}: NotificationsDrawerProps) {
  const { session } = useEdgeAuthContext();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [filter, setFilter] = React.useState<string>("all");
  const [isLoading, setIsLoading] = React.useState(false);

  // Charger les notifications depuis la base de données
  useEffect(() => {
    const loadNotifications = async () => {
      if (!session?.partner?.id) return;

      setIsLoading(true);
      try {
        const notifications = await getNotifications(session.partner.id);
        setNotifications(notifications);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && session?.partner?.id) {
      loadNotifications();
    }
  }, [isOpen, session?.partner?.id]);

  // Fermer le drawer si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Empêcher le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Obtenir le nombre de notifications non lues
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  // Marquer une notification comme lue
  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Filtrer les notifications
  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((notification) => notification.type === filter);

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
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[var(--zalama-card)] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* En-tête */}
          <NotificationHeader unreadCount={unreadCount} onClose={onClose} />

          {/* Filtres */}
          <NotificationFilters
            currentFilter={filter}
            onFilterChange={setFilter}
          />

          {/* Liste des notifications */}
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
          />

          {/* Pied de page */}
          <NotificationFooter onMarkAllAsRead={markAllAsRead} />
        </div>
      </div>
    </>
  );
}
