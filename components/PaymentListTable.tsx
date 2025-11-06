"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  poste?: string;
  photo_url?: string;
  salaire_net?: number;
}

interface PaymentData {
  employe_id: string;
  employe?: Employee;
  type: string;
  montant_total_remboursement: number;
  frais_service_total: number;
  nombre_remboursements: number;
  salaire_net?: number;
  salaire_restant: number;
  statut_global: string;
  periode: {
    periode_complete: string;
    description: string;
  };
  paiement_details?: any;
}

interface PaymentListTableProps {
  payments: PaymentData[];
  onViewDetails: (payment: PaymentData) => void;
  gnfFormatter: (value: number) => string;
}

export default function PaymentListTable({
  payments,
  onViewDetails,
  gnfFormatter,
}: PaymentListTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAYE":
      case "completed":
        return "success";
      case "EN_ATTENTE":
      case "pending":
        return "warning";
      case "EN_RETARD":
        return "error";
      case "ANNULE":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAYE":
        return "Payé";
      case "EN_ATTENTE":
        return "En attente";
      case "EN_RETARD":
        return "En retard";
      case "ANNULE":
        return "Annulé";
      default:
        return status;
    }
  };

  return (
    <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Paiements de salaire par employé
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Liste des paiements effectués aux employés
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
            <tr>
              <th className="w-1/5 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Employé
              </th>
              <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Période
              </th>
              <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Salaire Net
              </th>
              <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Avances déduites
              </th>
              <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Salaire reçu
              </th>
              <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Montant à rembourser
              </th>
              <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Statut
              </th>
              <th className="w-1/12 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-gray-400 text-sm"
                >
                  Aucun paiement trouvé.
                </td>
              </tr>
            ) : (
              payments.map((employeeData) => {
                const employee = employeeData.employe;
                const initials = employee
                  ? `${employee.prenom?.[0] || ""}${employee.nom?.[0] || ""}`
                  : "??";

                return (
                  <tr
                    key={employeeData.employe_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Employé */}
                    <td className="px-3 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          {employee?.photo_url ? (
                            <Image
                              src={employee.photo_url}
                              alt={`${employee.prenom} ${employee.nom}`}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                {initials}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {employee
                              ? `${employee.prenom} ${employee.nom}`
                              : "Inconnu"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {employee?.poste || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            Salaire: {gnfFormatter(employeeData.salaire_net || employee?.salaire_net || 0)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Période */}
                    <td className="px-3 py-4 text-left">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {employeeData.periode?.description || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {employeeData.periode?.periode_complete || "N/A"}
                      </p>
                    </td>

                    {/* Salaire Net */}
                    <td className="px-3 py-4 text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {gnfFormatter(employeeData.salaire_net || 0)}
                      </p>
                    </td>

                    {/* Avances déduites */}
                    <td className="px-3 py-4 text-center">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {gnfFormatter(employeeData.paiement_details?.avances_deduites || 0)}
                      </p>
                    </td>

                    {/* Salaire reçu */}
                    <td className="px-3 py-4 text-center">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {gnfFormatter(employeeData.salaire_restant || 0)}
                      </p>
                    </td>

                    {/* Montant à rembourser */}
                    <td className="px-3 py-4 text-center">
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {gnfFormatter(employeeData.montant_total_remboursement)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Frais: {gnfFormatter(employeeData.frais_service_total)}
                      </p>
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-4 text-center">
                      <Badge variant={getStatusBadgeVariant(employeeData.statut_global)}>
                        {getStatusLabel(employeeData.statut_global)}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => onViewDetails(employeeData)}
                        className="inline-flex items-center justify-center p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

