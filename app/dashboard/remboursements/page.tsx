'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Remboursement = {
  id: string;
  employe_id: string;
  partenaire_id: string;
  montant_total_remboursement: number;
  date_limite_remboursement: string;
  statut: string;
  date_remboursement_effectue: string | null;
  employee: {
    nom: string;
    prenom: string;
  };
};

export default function RemboursementsPage() {
  const supabase = createClientComponentClient();
  const { session, loading } = useAuth();
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAttente, setTotalAttente] = useState(0);
  const [paying, setPaying] = useState(false);
  const [selectedRemboursement, setSelectedRemboursement] = useState<Remboursement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAll, setPayAll] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(remboursements.length / itemsPerPage);
  const paginatedRemboursements = remboursements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Fonction de récupération des remboursements
  const fetchRemboursements = async () => {
    if (!session?.partner) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('remboursements')
      .select(`
        id, employe_id, partenaire_id, montant_total_remboursement, date_limite_remboursement, statut, date_remboursement_effectue,
        employee:employe_id (nom, prenom)
      `)
      .eq('partenaire_id', session.partner.id)
      .order('date_limite_remboursement', { ascending: true });
    if (error) {
      console.error('Erreur récupération remboursements:', error);
    }
    // Correction du typage: employee doit être un objet, pas un tableau
    const cleanData = (data || []).map((r: any) => ({
      ...r,
      employee: Array.isArray(r.employee) ? r.employee[0] : r.employee
    }));
    console.log('Remboursements:', cleanData);
    setRemboursements(cleanData);
    // Calcul du total en attente
    const total = (cleanData || [])
      .filter((r: any) => r.statut === 'EN_ATTENTE')
      .reduce((sum: number, r: any) => sum + Number(r.montant_total_remboursement), 0);
    setTotalAttente(total);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!loading && session?.partner) {
      console.log('Session:', session);
      fetchRemboursements();
    }
  }, [loading, session?.partner]);

  // Action "Payer" un remboursement
  const handlePaiementIndividuel = async () => {
    if (!selectedRemboursement) return;
    setPayLoading(true);
    setPayError(null);
    setPaymentUrl(null);
    try {
      const res = await fetch('https://admin.zalamasas.com/api/remboursements/simple-paiement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remboursement_id: selectedRemboursement.id }),
      });
      const data = await res.json();
      if (data.success && data.payment_url) {
        setPaymentUrl(data.payment_url);
        // Optionnel : window.open(data.payment_url, '_blank');
      } else {
        setPayError(data.error || "Erreur inconnue");
      }
    } catch (e) {
      setPayError("Erreur réseau");
    }
    setPayLoading(false);
  };

  // Action "Payer tous"
  const handlePaiementLot = async () => {
    if (!session?.partner?.id) return;
    setPayLoading(true);
    setPayError(null);
    setPaymentUrl(null);
    try {
      const res = await fetch('https://admin.zalamasas.com/api/remboursements/simple-paiement-lot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partenaire_id: session.partner.id }),
      });
      const data = await res.json();
      if (data.success && data.payment_url) {
        setPaymentUrl(data.payment_url);
        // Optionnel : window.open(data.payment_url, '_blank');
      } else {
        setPayError(data.error || "Erreur inconnue");
      }
    } catch (e) {
      setPayError("Erreur réseau");
    }
    setPayLoading(false);
  };

  // Handler pour ouvrir la modal de détail
  const handleViewDetail = (remb: Remboursement) => {
    setSelectedRemboursement(remb);
    setShowDetailModal(true);
  };

  // Handler pour ouvrir la modal de paiement (individuel ou total)
  const handleOpenPayModal = (remb?: Remboursement) => {
    if (remb) {
      setSelectedRemboursement(remb);
      setPayAll(false);
    } else {
      setSelectedRemboursement(null);
      setPayAll(true);
    }
    setShowPayModal(true);
  };

  // Handler pour fermer les modals
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setShowPayModal(false);
    setSelectedRemboursement(null);
    setPayAll(false);
    setPaymentUrl(null);
    setPayError(null);
    setPayLoading(false);
  };

  // Données pour les graphiques
  const stats = remboursements.reduce((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const employeStats = remboursements.reduce((acc, r) => {
    const nom = r.employee?.nom + ' ' + r.employee?.prenom;
    acc[nom] = (acc[nom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fonction utilitaire pour formater en GNF
  const gnfFormatter = (value: number) => `${value.toLocaleString()} GNF`;

  // Correction : total de tous les remboursements (pas seulement en attente)
  const totalRemboursements = remboursements.reduce((sum, r) => sum + Number(r.montant_total_remboursement), 0);

  // Skeleton
  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Remboursements</h1>
        <Button onClick={() => handleOpenPayModal()} disabled={paying || totalAttente === 0}>
          {paying ? 'Paiement...' : 'PAYER TOUS'}
        </Button>
      </div>

      <div className="bg-[var(--zalama-card)] border rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="text-lg font-semibold">Total des remboursements :</div>
        <div className="text-2xl font-bold text-orange-600">{gnfFormatter(totalRemboursements)}</div>
      </div>

      {/* Liste des remboursements */}
      <div className="bg-[var(--zalama-card)] border rounded-xl shadow p-0 overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-[var(--zalama-card)]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold border-b">Employé</th>
              <th className="px-4 py-3 text-left font-semibold border-b">Montant</th>
              <th className="px-4 py-3 text-left font-semibold border-b">Date limite</th>
              <th className="px-4 py-3 text-left font-semibold border-b">Statut</th>
              <th className="px-4 py-3 text-center font-semibold border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRemboursements.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">Aucun remboursement trouvé.</td>
              </tr>
            )}
            {paginatedRemboursements.map((r, idx) => (
              <tr key={r.id} className={
                `transition-colors ${idx % 2 === 0 ? 'bg-white/60 dark:bg-white/5' : 'bg-gray-50 dark:bg-gray-900/10'} hover:bg-blue-50 dark:hover:bg-blue-900/10 border-b last:border-b-0`
              }>
                <td className="px-4 py-3 whitespace-nowrap">{r.employee?.nom} {r.employee?.prenom}</td>
                <td className="px-4 py-3 font-semibold text-blue-900 dark:text-blue-200">{gnfFormatter(Number(r.montant_total_remboursement))}</td>
                <td className="px-4 py-3">{new Date(r.date_limite_remboursement).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${r.statut === 'PAYE' ? 'bg-green-100 text-green-700' :
                      r.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'}`}>
                    {r.statut}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center justify-center gap-2">
                  <button title="Voir détail" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleViewDetail(r)}>
                    <Eye className="w-5 h-5 text-blue-600" />
                  </button>
                  {r.statut === 'EN_ATTENTE' && (
                    <button title="Payer" onClick={() => handleOpenPayModal(r)} disabled={paying}
                      className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-900 transition-colors disabled:opacity-50">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            className="px-3 py-1 rounded border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[var(--zalama-card)] border rounded-xl shadow p-6">
          <h2 className="font-semibold mb-2">Répartition par statut</h2>
          <Pie
            data={{
              labels: Object.keys(stats),
              datasets: [{
                data: Object.values(stats),
                backgroundColor: ['#fbbf24', '#34d399', '#a1a1aa', '#f87171'],
              }]
            }}
          />
        </div>
        <div className="bg-[var(--zalama-card)] border rounded-xl shadow p-6">
          <h2 className="font-semibold mb-2">Répartition par employé</h2>
          <Bar
            data={{
              labels: Object.keys(employeStats),
              datasets: [{
                label: 'Nombre de remboursements',
                data: Object.values(employeStats),
                backgroundColor: '#6366f1',
              }]
            }}
            options={{
              indexAxis: 'y' as const,
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      </div>

      {/* Modal de détail */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détail du remboursement</DialogTitle>
            <DialogDescription>
              Informations détaillées du remboursement sélectionné.
            </DialogDescription>
          </DialogHeader>
          {selectedRemboursement && (
            <div className="space-y-3">
              <div><span className="font-semibold">Employé :</span> {selectedRemboursement.employee?.nom} {selectedRemboursement.employee?.prenom}</div>
              <div><span className="font-semibold">Montant :</span> {gnfFormatter(Number(selectedRemboursement.montant_total_remboursement))}</div>
              <div><span className="font-semibold">Date limite :</span> {new Date(selectedRemboursement.date_limite_remboursement).toLocaleDateString('fr-FR')}</div>
              <div><span className="font-semibold">Statut :</span> {selectedRemboursement.statut}</div>
              <div><span className="font-semibold">Date paiement :</span> {selectedRemboursement.date_remboursement_effectue ? new Date(selectedRemboursement.date_remboursement_effectue).toLocaleDateString('fr-FR') : '-'}</div>
              {/* Ajouter d'autres champs si besoin */}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de paiement (individuel ou total) */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paiement via Orange Money (Lengopay)</DialogTitle>
            <DialogDescription>
              Confirmez le paiement via Lengopay. Les champs sont préremplis et non modifiables.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Montant à payer</label>
              <Input value={payAll ? gnfFormatter(totalRemboursements) : gnfFormatter(Number(selectedRemboursement?.montant_total_remboursement || 0))} readOnly disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro Orange Money</label>
              <Input value={session?.partner?.telephone || ''} readOnly disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service</label>
              <Input value="Lengopay (Orange Money)" readOnly disabled />
            </div>
            {/* Ajouter d'autres champs si besoin */}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Annuler</Button>
            <Button
              onClick={payAll ? handlePaiementLot : handlePaiementIndividuel}
              disabled={payLoading}
            >
              {payLoading
                ? 'Paiement en cours...'
                : payAll
                  ? 'Payer le total'
                  : 'Payer ce remboursement'}
            </Button>
          </DialogFooter>
          {payError && (
            <div className="text-red-600 text-sm mt-2">{payError}</div>
          )}
          {paymentUrl && (
            <div className="mt-4">
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline font-semibold"
              >
                Accéder au paiement
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
