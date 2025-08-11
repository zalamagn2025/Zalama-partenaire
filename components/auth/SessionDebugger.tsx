"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SessionDebugger() {
  const { session, loading, error, refreshSession, clearCache, forceRefresh } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Ne pas afficher en production
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 shadow-lg border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔍 Debug Session</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Masquer' : 'Afficher'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>État:</span>
            <span className={`font-medium ${
              loading ? 'text-yellow-600' : 
              session ? 'text-green-600' : 'text-red-600'
            }`}>
              {loading ? 'Chargement... ⏳' : session ? 'Connecté ✅' : 'Déconnecté ❌'}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            Loading: {loading ? 'true' : 'false'} | Session: {session ? 'exists' : 'null'}
          </div>
          
          {error && (
            <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {showDetails && session && (
            <div className="space-y-2 mt-3 pt-3 border-t">
              <div>
                <strong>Utilisateur:</strong>
                <div className="text-gray-600 ml-2">
                  ID: {session.user.id}<br/>
                  Email: {session.user.email}
                </div>
              </div>
              
              <div>
                <strong>Admin:</strong>
                <div className="text-gray-600 ml-2">
                  Rôle: {session.admin.role}<br/>
                  Partenaire ID: {session.admin.partenaire_id}
                </div>
              </div>
              
              <div>
                <strong>Partenaire:</strong>
                <div className="text-gray-600 ml-2">
                  Nom: {session.partner.company_name}<br/>
                  Statut: {session.partner.status}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshSession}
              className="text-xs"
            >
              🔄 Rafraîchir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearCache}
              className="text-xs bg-orange-50 hover:bg-orange-100"
            >
              🗑️ Cache
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={forceRefresh}
              className="text-xs bg-red-50 hover:bg-red-100"
            >
              ⚡ Force
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
