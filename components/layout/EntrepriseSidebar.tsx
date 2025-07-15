"use client";
import { Home, Users, BarChart2, AlertCircle, Settings, LogOut, ChevronLeft, ChevronRight, User2, FileText, CreditCard, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Les liens de navigation pour le tableau de bord
const getNavItems = () => [
  { label: 'Tableau de bord', icon: Home, href: `/dashboard` },
  { label: 'Employés', icon: Users, href: `/dashboard/employes` },
  { label: 'Demandes', icon: FileText, href: `/dashboard/demandes` },
  { label: 'Finances', icon: CreditCard, href: `/dashboard/finances` },
  // Ajout du lien Remboursements
  { label: 'Remboursements', icon: BarChart2, href: `/dashboard/remboursements` },
  { label: 'Avis des Salariés', icon: Star, href: `/dashboard/avis` },
  { label: 'Paramètres', icon: Settings, href: `/dashboard/parametres` },
];

export default function EntrepriseSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  
  // Générer les liens de navigation avec le slug
  const navItems = getNavItems();

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    
    // Mettre à jour la variable CSS pour le layout
    document.documentElement.style.setProperty(
      '--current-sidebar-width', 
      newCollapsedState ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setMenuOpen(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fermer le menu déroulant si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <aside 
      className={`sidebar fixed top-0 left-0 h-full bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
    >
      {/* Logo et titre */}
      <div className="flex items-center justify-between h-18 px-4 border-b border-[var(--zalama-border)]">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <div className="relative w-32 h-20 mr-3">
              <Image 
                src="/images/Logo_vertical.svg" 
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
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          {collapsed ? 
            <ChevronRight className="w-5 h-5" /> : 
            <ChevronLeft className="w-5 h-5" />
          }
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6 px-2 h-[calc(100vh-4.5rem-6rem)] overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                  <span className={`${collapsed ? 'hidden' : 'block'} sidebar-text`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Profil utilisateur */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center w-full rounded-lg p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-[var(--zalama-blue)] flex items-center justify-center text-white font-semibold flex-shrink-0">
                {session?.admin?.display_name?.charAt(0) || 'A'}
              </div>
              {!collapsed && (
                <div className="ml-3 sidebar-text">
                  <p className="text-sm font-medium">{session?.partner?.nom || 'Entreprise'}</p>
                  <p className="text-xs text-[var(--zalama-gray)]/60">
                    {session?.admin?.role?.charAt(0).toUpperCase() + session?.admin?.role?.slice(1) || 'Administrateur'}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && <ChevronRight className="w-4 h-4 sidebar-text" />}
          </button>
          
          {menuOpen && !collapsed && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-[var(--zalama-card)] dark:text-gray-300 rounded-lg border border-[var(--zalama-border)] shadow-lg overflow-hidden">
              <ul>
                <li>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
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
