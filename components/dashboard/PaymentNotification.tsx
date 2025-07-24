'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PaymentNotification {
  id: string;
  titre: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  lu: boolean;
}

interface PaymentNotificationProps {
  onClose?: () => void;
}

export default function PaymentNotification({ onClose }: PaymentNotificationProps) {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simuler la récupération des notifications de paiement
    // En réalité, cela viendrait de votre système de notifications
    const mockNotifications: PaymentNotification[] = [
      {
        id: '1',
        titre: 'Paiement réussi',
        message: 'Votre remboursement de 500,000 GNF a été traité avec succès.',
        type: 'success',
        timestamp: new Date().toISOString(),
        lu: false
      }
    ];

    setNotifications(mockNotifications);
    setIsVisible(true);

    // Auto-fermeture après 10 secondes
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Card key={notification.id} className={`w-80 shadow-lg ${getBgColor(notification.type)}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getIcon(notification.type)}
                <CardTitle className="text-sm font-semibold">
                  {notification.titre}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm">
              {notification.message}
            </CardDescription>
            <div className="mt-2 text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 