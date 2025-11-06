"use client";
import {
  Bell,
  LogOut,
  User,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Utilisation du composant NotificationDrawer (sans 's') du dossier dashboard/notifications
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { supabase } from "@/lib/supabase";
import NotificationDrawer from "../../components/dashboard/notifications/NotificationDrawer";

export default function EntrepriseHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshStatus, setAutoRefreshStatus] = useState<
    "active" | "inactive" | "error"
  >("inactive");
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { session, logout, refreshSession } = useEdgeAuthContext();
  const router = useRouter();

  // Effet de scroll pour l'effet glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Charger le nombre de notifications non lues
  const loadUnreadCount = async () => {
    if (!session?.admin?.id) return;
    try {
      // Utiliser le proxy pour compter les notifications non lues
      const response = await fetch(
        `/api/proxy/notifications?user_id=${session.admin.id}&lu=false&count=true`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement du nombre de notifications:",
        error
      );
    }
  };

  // Charger le nombre au montage et quand la session change
  useEffect(() => {
    if (session?.admin?.id) {
      loadUnreadCount();
    }
  }, [session?.admin?.id]);

  // Recharger toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.admin?.id) {
        loadUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [session?.admin?.id]);

  // Surveiller le statut du refresh automatique
  useEffect(() => {
    if (session?.access_token) {
      setAutoRefreshStatus("active");

      // Simuler un monitoring du refresh automatique
      const statusInterval = setInterval(() => {
        // Vérifier si la session est toujours valide
        if (session?.access_token) {
          setAutoRefreshStatus("active");
        } else {
          setAutoRefreshStatus("error");
        }
      }, 60000); // Vérifier toutes les minutes

      return () => clearInterval(statusInterval);
    } else {
      setAutoRefreshStatus("inactive");
    }
  }, [session?.access_token]);

  // Obtenir le titre de la page en fonction du chemin
  const getPageTitle = () => {
    console.log("🔍 Current pathname:", pathname); // Debug log
    if (!pathname) return "Tableau de Bord";

    // Vérifier les sous-pages en premier (plus spécifiques)
    if (pathname.includes("/demandes-adhesion")) return "Demandes d'Adhésion";
    if (pathname.includes("/demandes")) return "Gestion des avances";
    if (pathname.includes("/paiements")) return "Paiement de salaire";
    if (pathname.includes("/remboursements")) return "Gestion des remboursements";
    if (pathname.includes("/employes")) return "Gestion des Employés";
    if (pathname.includes("/finances")) return "Finances";
    if (pathname.includes("/statistiques")) return "Statistiques";
    if (pathname.includes("/alertes")) return "Alertes";
    if (pathname.includes("/parametres")) return "Paramètres";
    
    // Page principale du dashboard en dernier
    if (pathname === "/dashboard") return "Tableau de Bord";

    return "Tableau de Bord";
  };

  // Gérer l'ouverture/fermeture du drawer de notifications
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      setAutoRefreshStatus("active");
      console.log("🔄 Refresh manuel demandé...");
      await refreshSession();
      await loadUnreadCount(); // Recharger aussi les notifications
      console.log("✅ Refresh manuel terminé");
    } catch (error) {
      console.error("❌ Erreur lors du refresh manuel:", error);
      setAutoRefreshStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
      router.replace("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <>
      <header 
        className="w-full h-20 flex items-center justify-between px-4 md:px-8 border-b shadow-lg sticky top-0 z-20 transition-all duration-300"
        style={{
          background: isScrolled ? 'rgba(12, 26, 46, 0.8)' : 'var(--zalama-bg-darker)',
          borderColor: 'var(--zalama-border)',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none'
        }}
      >
        {/* Titre de la page */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--zalama-text)' }}>
            {getPageTitle()}
          </h1>
        </div>

        {/* Bloc actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Indicateur de statut du refresh automatique */}
          {/* <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                autoRefreshStatus === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  : autoRefreshStatus === "error"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
              title={
                autoRefreshStatus === "active"
                  ? "Refresh automatique actif (toutes les 8 minutes)"
                  : autoRefreshStatus === "error"
                  ? "Erreur de refresh automatique"
                  : "Refresh automatique inactif"
              }
            >
              {autoRefreshStatus === "active" ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {autoRefreshStatus === "active" ? "Auto" : "Manuel"}
              </span>
            </div>
          </div> */}

          {/* Bouton de refresh manuel */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full backdrop-blur-sm hover:scale-110 hover:shadow-md border transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Actualiser les données manuellement"
            style={{
              background: 'var(--zalama-bg-light)',
              borderColor: 'var(--zalama-border)',
              color: 'var(--zalama-text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.background = 'var(--zalama-bg-lighter)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--zalama-bg-light)';
            }}
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            className="relative p-2 rounded-full backdrop-blur-sm transition-all duration-200 focus:outline-none"
            aria-label="Voir les notifications"
            onClick={toggleNotifications}
            style={{ color: 'var(--zalama-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--zalama-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--zalama-text-secondary)';
            }}
          >
            <Bell className="w-6 h-6 transition-colors" />
            <span className="animate-ping absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full opacity-75" style={{ background: 'var(--zalama-danger)' }}></span>
            <span className="absolute -top-1 -right-1 text-[10px] text-white rounded-full px-1" style={{ background: 'var(--zalama-danger)' }}>
              {unreadCount}
            </span>
          </button>

        </div>
      </header>

      {/* Drawer de notifications */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
