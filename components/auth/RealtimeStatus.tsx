"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RealtimeStatus() {
  const { session } = useEdgeAuthContext();

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-sm text-gray-500">
          Debug - Status Temps Réel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs space-y-1">
          <p>
            <strong>Session:</strong> {session ? "Connecté" : "Non connecté"}
          </p>
          {session && (
            <>
              <p>
                <strong>User ID:</strong> {session.user.id}
              </p>
              <p>
                <strong>Email:</strong> {session.user.email}
              </p>
              <p>
                <strong>Partner:</strong> {session.partner.company_name}
              </p>
              <p>
                <strong>Role:</strong> {session.admin.role}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
