"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RealtimeStatus() {
  const { session } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-32 right-4 w-80 bg-green-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-green-700">
          🚀 Realtime Actif
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-green-600 space-y-1">
          <div>✅ Écoute admin_users</div>
          <div>✅ Écoute partners</div>
          <div>⏰ Refresh auto: 5min</div>
          {session && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <div>🔄 Cache: {session.partner.company_name}</div>
              <div>📊 Dernière MAJ: {new Date().toLocaleTimeString()}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
