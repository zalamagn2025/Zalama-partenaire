"use client";

import React from 'react';
import EntrepriseSidebar from '@/components/layout/EntrepriseSidebar';
/* import '@/styles/zalama-theme.css'; */
import { ThemeProvider } from '@/contexts/ThemeContext';
import EntrepriseHeader from '@/components/layout/EntrepriseHeader';

export default function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-[var(--zalama-bg-dark)]">
        <EntrepriseSidebar />
        <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--current-sidebar-width, var(--sidebar-width))' }}>
          <EntrepriseHeader />
          <main className="flex-1 mb-8 overflow-y-auto px-6" style={{scrollbarWidth: "none"}}>
              {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
