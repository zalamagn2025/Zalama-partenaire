'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type PaymentStatus = 'success' | 'failed' | 'pending' | 'unknown';

interface PaymentResult {
  status: PaymentStatus;
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  timestamp?: string;
  reference?: string;
}

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer les paramètres de l'URL de retour
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transaction_id');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const message = searchParams.get('message');
    const reference = searchParams.get('reference');
    const error = searchParams.get('error');

    // Déterminer le statut du paiement
    let paymentStatus: PaymentStatus = 'unknown';
    let resultMessage = '';

    if (status === 'success' || status === 'completed') {
      paymentStatus = 'success';
      resultMessage = message || 'Paiement effectué avec succès !';
    } else if (status === 'failed' || status === 'error' || error) {
      paymentStatus = 'failed';
      resultMessage = message || error || 'Le paiement a échoué.';
    } else if (status === 'pending') {
      paymentStatus = 'pending';
      resultMessage = message || 'Paiement en cours de traitement...';
    } else {
      paymentStatus = 'unknown';
      resultMessage = 'Statut de paiement inconnu.';
    }

    setPaymentResult({
      status: paymentStatus,
      transactionId: transactionId || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      currency: currency || 'GNF',
      message: resultMessage,
      timestamp: new Date().toISOString(),
      reference: reference || undefined,
    });

    setIsLoading(false);
  }, [searchParams]);

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  const handleReturnToRemboursements = () => {
    router.push('/dashboard/remboursements');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDownloadReceipt = () => {
    if (!paymentResult) return;
    
    // Créer un reçu simple en format texte
    const receipt = `
=== RECU DE PAIEMENT ZALAMA ===
Date: ${new Date(paymentResult.timestamp || '').toLocaleString('fr-FR')}
Statut: ${paymentResult.status === 'success' ? 'SUCCES' : paymentResult.status === 'failed' ? 'ECHEC' : 'EN ATTENTE'}
${paymentResult.transactionId ? `Transaction ID: ${paymentResult.transactionId}` : ''}
${paymentResult.reference ? `Référence: ${paymentResult.reference}` : ''}
${paymentResult.amount ? `Montant: ${paymentResult.amount.toLocaleString()} ${paymentResult.currency}` : ''}
Message: ${paymentResult.message}
================================
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-paiement-${paymentResult.transactionId || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-16 w-16 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBgColor = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Vérification du statut de paiement...</p>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erreur</CardTitle>
            <CardDescription className="text-center">
              Impossible de récupérer les informations de paiement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={handleReturnToDashboard} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className={`w-full max-w-lg ${getStatusBgColor(paymentResult.status)}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(paymentResult.status)}
          </div>
          <CardTitle className={`text-2xl font-bold ${getStatusColor(paymentResult.status)}`}>
            {paymentResult.status === 'success' && 'Paiement Réussi !'}
            {paymentResult.status === 'failed' && 'Paiement Échoué'}
            {paymentResult.status === 'pending' && 'Paiement en Cours'}
            {paymentResult.status === 'unknown' && 'Statut Inconnu'}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {paymentResult.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Détails de la transaction */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Détails de la transaction</h3>
            {paymentResult.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="font-mono text-sm">{paymentResult.transactionId}</span>
              </div>
            )}
            {paymentResult.reference && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Référence:</span>
                <span className="font-mono text-sm">{paymentResult.reference}</span>
              </div>
            )}
            {paymentResult.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                <span className="font-semibold">
                  {paymentResult.amount.toLocaleString()} {paymentResult.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="text-sm">
                {new Date(paymentResult.timestamp || '').toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {paymentResult.status === 'success' && (
              <Button onClick={handleDownloadReceipt} className="w-full bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le reçu
              </Button>
            )}
            
            <Button 
              onClick={handleReturnToRemboursements} 
              className="w-full"
              variant={paymentResult.status === 'success' ? 'outline' : 'default'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux remboursements
            </Button>

            <Button 
              onClick={handleReturnToDashboard} 
              variant="outline" 
              className="w-full"
            >
              Tableau de bord
            </Button>

            {paymentResult.status === 'failed' && (
              <Button onClick={handleRefresh} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Informations importantes
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {paymentResult.status === 'success' && (
                <>
                  <li>• Votre paiement a été traité avec succès</li>
                  <li>• Un reçu électronique a été généré</li>
                  <li>• Le statut sera mis à jour dans votre tableau de bord</li>
                </>
              )}
              {paymentResult.status === 'failed' && (
                <>
                  <li>• Le paiement n'a pas pu être traité</li>
                  <li>• Vérifiez vos informations de paiement</li>
                  <li>• Contactez le support si le problème persiste</li>
                </>
              )}
              {paymentResult.status === 'pending' && (
                <>
                  <li>• Votre paiement est en cours de traitement</li>
                  <li>• Vous recevrez une confirmation par email</li>
                  <li>• Actualisez cette page pour vérifier le statut</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 