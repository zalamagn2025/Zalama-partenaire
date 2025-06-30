"use client";

import React from 'react';
import EntrepriseSidebar from '@/components/layout/EntrepriseSidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import EntrepriseHeader from '@/components/layout/EntrepriseHeader';
import '@/styles/zalama-theme.css';
import { Toaster } from 'react-hot-toast';

export default function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <EntrepriseSidebar />
          <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--current-sidebar-width, var(--sidebar-width))' }}>
            <EntrepriseHeader />
            <main className="flex-1 mb-8 overflow-y-auto px-6 text-gray-900 dark:text-white" style={{scrollbarWidth: "none"}}>
                {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </ThemeProvider>
    </AuthProvider>
  );
}