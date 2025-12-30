"use client";
import {
  Home,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
  Star,
  UserCheck,
  Banknote,
  DollarSign,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useRouter } from "next/navigation";

// Les liens de navigation pour le tableau de bord
const getNavItems = () => [
  { label: "Tableau de bord", icon: Home, href: `/dashboard` },
  {
    label: "Demandes d'Adhésion",
    icon: UserPlus,
    href: `/dashboard/demandes-adhesion`,
  },
  { label: "Employés", icon: UserCheck, href: `/dashboard/employes` },
  { label: "Demande d'avance", icon: FileText, href: `/dashboard/demandes` },
  // Ajout du lien Paiement par wallets
  {
    label: "Paiement par wallets",
    icon: Banknote,
    href: `/dashboard/paiements`,
  },
  // Ajout du lien Paiements par avances de trésorerie
  {
    label: "Paiements par avances de trésorerie",
    icon: CreditCard,
    href: `/dashboard/paiements-tresorerie`,
  },
  // Ajout du lien Remboursements
  {
    label: "Remboursements",
    icon: BarChart2,
    href: `/dashboard/remboursements`,
  },
  { label: "Avis des Salariés", icon: Star, href: `/dashboard/avis` },
  // { label: "Finances", icon: CreditCard, href: `/dashboard/finances` },
  // Ajout du lien Test Djomy
  /* {
    label: "Test Djomy",
    icon: CreditCard,
    href: `/dashboard/remboursements-test`,
  }, */
  /* { label: "Documents", icon: FolderOpen, href: `/dashboard/documents` }, */
  { label: "Paramètres", icon: Settings, href: `/dashboard/parametres` },
];

export default function EntrepriseSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { session, logout } = useEdgeAuthContext();
  const router = useRouter();

  // Générer les liens de navigation avec le slug
  const navItems = getNavItems();

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);

    // Mettre à jour la variable CSS pour le layout
    document.documentElement.style.setProperty(
      "--current-sidebar-width",
      newCollapsedState
        ? "var(--sidebar-collapsed-width)"
        : "var(--sidebar-width)"
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      router.replace("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Fermer le menu déroulant si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <aside
      className={`sidebar fixed top-0 left-0 h-full border-r transition-all duration-300 z-30 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        width: collapsed
          ? "var(--sidebar-collapsed-width)"
          : "var(--sidebar-width)",
        background: 'var(--zalama-bg-darker)',
        borderColor: 'var(--zalama-border)'
      }}
    >
      {/* Logo et titre */}
      <div className="flex items-center justify-between h-18 px-4 border-b" style={{ borderColor: 'var(--zalama-border)' }}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <div className="relative w-32 h-20 mr-3">
              <Image
                src="/images/Logo.svg"
                alt="ZaLaMa Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="h-20 flex items-center justify-center w-full">
            {/* Espace vide quand la sidebar est repliée */}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full bg-transparent hover:scale-110 hover:shadow-lg border border-transparent transition-all duration-300 backdrop-blur-sm"
          style={{ color: 'var(--zalama-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'var(--zalama-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-2 h-[calc(100vh-4.5rem-6rem)] overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // Logique simple et fiable pour détecter l'élément actif
            let isActive = false;

            if (item.href === "/dashboard") {
              // Pour le dashboard principal, match exact
              isActive = pathname === "/dashboard";
            } else {
              // Pour les autres pages, match exact ou avec sous-pages
              isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? "border-l-4 shadow-lg backdrop-blur-sm"
                      : "hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm hover:border-l-2"
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'rgba(255, 103, 31, 0.2)',
                          color: 'var(--zalama-orange)',
                          borderLeftColor: 'var(--zalama-orange)'
                        }
                      : {
                          color: 'var(--zalama-text)'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = 'var(--zalama-orange)';
                      e.currentTarget.style.borderLeftColor = 'rgba(255, 103, 31, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--zalama-text)';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }
                  }}
                >
                  <item.icon
                    className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${collapsed ? "mx-auto" : "mr-3"}`}
                  />
                  <span
                    className={`${collapsed ? "hidden" : "block"} sidebar-text`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profil utilisateur */}
      <div className="absolute bottom-0 left-0 right-0 border-t p-4" style={{ borderColor: 'var(--zalama-border)' }}>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center w-full rounded-lg p-2 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm border border-transparent transition-all duration-300 group ${
              collapsed ? "justify-center" : "justify-between"
            }`}
            style={{ color: 'var(--zalama-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--zalama-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div
              className={`flex items-center ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-lg overflow-hidden" style={{ background: session?.admin?.photoUrl ? 'transparent' : 'var(--zalama-orange)' }}>
                {session?.admin?.photoUrl ? (
                  <Image
                    src={session.admin.photoUrl}
                    alt={session?.admin?.display_name || "Profil"}
                    fill
                    className="object-cover rounded-full"
                    sizes="32px"
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {session?.admin?.display_name?.charAt(0) || "P"}
                  </span>
                )}
              </div>
              {!collapsed && (
                <div className="ml-3 sidebar-text min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium truncate text-left" style={{ color: 'var(--zalama-text)' }} title={session?.admin?.display_name || "Partenaire"}>
                    {session?.admin?.display_name || "Partenaire"}
                  </p>
                  <p className="text-xs truncate text-left" style={{ color: 'var(--zalama-text-secondary)' }} title={session?.admin?.role || "Entreprise"}>
                    {session?.admin?.role
                      ? session.admin.role.charAt(0).toUpperCase() +
                        session.admin.role.slice(1)
                      : "Entreprise"}
                  </p>
                </div>
              )}
            </div>
            {/* {!collapsed && <ChevronRight className="w-4 h-4 sidebar-text group-hover:scale-110 transition-all duration-300" />} */}
          </button>

          {menuOpen && !collapsed && (
            <div className="absolute bottom-full left-0 w-full mb-2 backdrop-blur-xl rounded-lg border shadow-xl overflow-hidden" style={{ background: 'var(--zalama-bg-light)', borderColor: 'var(--zalama-border)' }}>
              <ul>
                <li>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm hover:scale-105 hover:shadow-lg transition-all duration-300 rounded-md group"
                    style={{ color: 'var(--zalama-danger)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-all duration-300" />
                    Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
