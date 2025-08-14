"use client";
import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Utilisation du composant NotificationDrawer (sans 's') du dossier dashboard/notifications
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import NotificationDrawer from "../../components/dashboard/notifications/NotificationDrawer";

export default function EntrepriseHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();
  const router = useRouter();

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

  const handleLogout = async () => {
    await signOut();
    setProfileMenuOpen(false);
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <header className="w-full h-20 flex items-center justify-between px-4 md:px-8 bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] shadow-sm sticky top-0 z-20">
        {/* Titre de la page */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <div className="hidden md:flex items-center ml-6 text-gray-600 dark:text-gray-300 text-sm">
            <span className="bg-blue-100 text-xl dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-6">
              {session?.partner?.company_name || "Dashboard"}
            </span>
          </div>
        </div>

        {/* Bloc actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            className="relative focus:outline-none"
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
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
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

          {/* Menu de profil avec bouton de déconnexion */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                {session?.admin?.display_name || "Admin"}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={(e) => handleLogout()}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
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
