"use client";
import {
  Bell,
  LogOut,
  Moon,
  Sun,
  User,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Utilisation du composant NotificationDrawer (sans 's') du dossier dashboard/notifications
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { theme, toggleTheme } = useTheme();
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
      // Compter les notifications non lues pour cet admin
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.admin.id)
        .eq("lu", false);
      if (!error) {
        setUnreadCount(count || 0);
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
    if (!pathname) return "Tableau de Bord";

    if (pathname === "/dashboard") return "Tableau de Bord";
    if (pathname.includes("/employes")) return "Gestion des Employés";
    if (pathname.includes("/finances")) return "Finances";
    if (pathname.includes("/statistiques")) return "Statistiques";
    if (pathname.includes("/demandes")) return "Demandes";
    if (pathname.includes("/alertes")) return "Alertes";
    if (pathname.includes("/parametres")) return "Paramètres";

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
      <header className={`w-full h-20 flex items-center justify-between px-4 md:px-8 border-b border-[var(--zalama-border)]/30 shadow-lg sticky top-0 z-20 transition-all duration-300 ${
        isScrolled 
          ? "bg-[var(--zalama-card)]/80 backdrop-blur-xl" 
          : "bg-[var(--zalama-bg-darker-light)]"
      }`}>
        {/* Titre de la page */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
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
            className="p-2 rounded-full bg-[var(--zalama-card)]/60 backdrop-blur-sm hover:bg-[var(--zalama-card)]/80 hover:scale-110 hover:shadow-md border border-[var(--zalama-border)]/30 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Actualiser les données manuellement"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>

          <button
            className="relative p-2 rounded-full hover:bg-[var(--zalama-card)]/40 backdrop-blur-sm transition-all duration-200 focus:outline-none"
            aria-label="Voir les notifications"
            onClick={toggleNotifications}
          >
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" />
            <span className="animate-ping absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-red-500/70 opacity-75"></span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white rounded-full px-1">
              {unreadCount}
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--zalama-card)]/60 backdrop-blur-sm hover:bg-[var(--zalama-card)]/80 hover:scale-110 hover:shadow-md border border-[var(--zalama-border)]/30 transition-all duration-200 focus:outline-none"
            aria-label={
              theme === "dark"
                ? "Passer en mode clair"
                : "Passer en mode sombre"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            )}
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
