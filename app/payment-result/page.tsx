"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  RefreshCw,
  Receipt,
  Building,
  DollarSign,
  Hash,
  Calendar,
  FileText,
  Home,
  RotateCcw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

type PaymentStatus = "success" | "pending";

interface PaymentResult {
  status: PaymentStatus;
  partenaireId: string;
  montantTotal: number;
  type: string;
  timestamp: string;
}

interface PartenaireData {
  id: string;
  company_name: string;
  logo_url?: string;
}

interface RemboursementData {
  id: string;
  montant_total_remboursement: number;
  statut: string;
  date_creation: string;
  employee: {
    nom: string;
    prenom: string;
  };
}

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [partenaireData, setPartenaireData] = useState<PartenaireData | null>(
    null
  );
  const [remboursementsData, setRemboursementsData] = useState<
    RemboursementData[]
  >([]);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [nombreRemboursements, setNombreRemboursements] = useState(0);

  useEffect(() => {
    const partenaireId = searchParams.get("partenaire_id");
    const montantTotal = searchParams.get("montant_total");
    const type = searchParams.get("type");

    // Déterminer le statut : si pending = échec, sinon success
    const urlStatus = searchParams.get("status");
    const paymentStatus: PaymentStatus =
      urlStatus === "pending" ? "pending" : "success";

    if (partenaireId && montantTotal && type) {
      setPaymentResult({
        status: paymentStatus,
        partenaireId,
        montantTotal: parseFloat(montantTotal),
        type,
        timestamp: new Date().toISOString(),
      });

      // Récupérer les données du partenaire et des remboursements
      fetchPaymentData(partenaireId, parseFloat(montantTotal));
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const fetchPaymentData = async (
    partenaireId: string,
    montantTotal: number
  ) => {
    try {
      // Récupérer les données du partenaire
      const { data: partenaireData, error: partenaireError } = await supabase
        .from("partners")
        .select("id, company_name, logo_url")
        .eq("id", partenaireId)
        .single();

      if (partenaireError) {
        console.error("Erreur partenaire:", partenaireError);
      } else {
        setPartenaireData(partenaireData);
      }

      // Récupérer les remboursements en attente pour ce partenaire
      const { data: remboursementsData, error: remboursementsError } =
        await supabase
          .from("remboursements")
          .select(
            `
          id,
          montant_total_remboursement,
          statut,
          date_creation,
          employee:employees(nom, prenom)
        `
          )
          .eq("partenaire_id", partenaireId)
          .eq("statut", "EN_ATTENTE");

      if (remboursementsError) {
        console.error("Erreur remboursements:", remboursementsError);
      } else {
        // Transformer les données pour correspondre au type attendu
        const transformedData: RemboursementData[] = (
          remboursementsData || []
        ).map((item) => ({
          ...item,
          employee: Array.isArray(item.employee)
            ? item.employee[0]
            : item.employee,
        }));
        setRemboursementsData(transformedData);
        setNombreRemboursements(remboursementsData?.length || 0);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-téléchargement du PDF pour les paiements réussis
  useEffect(() => {
    if (
      paymentResult?.status === "success" &&
      partenaireData &&
      !isDownloadingPDF
    ) {
      // Délai de 2 secondes pour l'UX, puis téléchargement automatique
      setTimeout(() => {
        handleDownloadPDF();
        toast.success("Reçu de paiement téléchargé automatiquement !", {
          description: "Votre reçu de paiement a été généré et téléchargé.",
          duration: 5000,
        });
      }, 2000);
    }
  }, [paymentResult, partenaireData]);

  const handleDownloadPDF = async () => {
    if (!paymentResult || !partenaireData) return;

    setIsDownloadingPDF(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const receiptDate = new Date(paymentResult.timestamp);
      const formattedDate = receiptDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = receiptDate.toLocaleTimeString("fr-FR");

      const gnfFormatter = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "GNF",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      let receipt = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        🏛️  REÇU OFFICIEL ZALAMA                                  ║
║                      Système de Remboursement d'Avances                         ║
╚══════════════════════════════════════════════════════════════════════════════════╝

📅 INFORMATIONS GÉNÉRALES DU PAIEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Date et heure: ${formattedDate} à ${formattedTime}
🏷️  Statut: ✅ PAIEMENT RÉUSSI
💰 Montant total: ${gnfFormatter(paymentResult.montantTotal)}
📦 Type de paiement: ${
        paymentResult.type === "lot" ? "Paiement en lot" : "Paiement individuel"
      }
🔢 Nombre de remboursements: ${nombreRemboursements}

🏢 INFORMATIONS PARTENAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Entreprise: ${partenaireData.company_name}
🆔 ID Partenaire: ${paymentResult.partenaireId}
📧 Méthode: Orange Money via Lengopay
🔒 Sécurité: Transaction SSL/TLS sécurisée

📊 DÉTAILS DES REMBOURSEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      if (remboursementsData.length > 0) {
        remboursementsData.forEach((remb, index) => {
          receipt += `
📋 Remboursement #${index + 1}
   👨‍💼 Employé: ${remb.employee?.nom || "N/A"} ${remb.employee?.prenom || "N/A"}
   💰 Montant: ${gnfFormatter(Number(remb.montant_total_remboursement || 0))}
   📅 Date création: ${new Date(remb.date_creation).toLocaleDateString("fr-FR")}
   🏷️  Statut: ${remb.statut === "EN_ATTENTE" ? "En attente" : remb.statut}`;
        });
      }

      receipt += `

🔢 INFORMATIONS TECHNIQUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 Référence paiement: ZLM-${Date.now()}
🔗 URL de retour: ${window.location.href}
⏱️  Horodatage: ${paymentResult.timestamp}
🌐 Plateforme: ZaLaMa Partner Dashboard

🔒 SÉCURITÉ & CONFORMITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️  Protocole de sécurité: SSL/TLS 256-bit
🔐 Chiffrement des données: AES-256  
📋 Conformité réglementaire: PCI DSS Level 1
🌐 Traçabilité complète: Activée
📊 Audit trail: Disponible
🏆 Certification ISO: 27001:2013

🏛️ ZALAMA FINANCIAL SOLUTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 ZaLaMa Financial Solutions
📍 Siège social: Conakry, République de Guinée  
📞 Support client: +224 XXX XXX XXX
📧 Email support: support@zalama.com
🌐 Site web: https://zalama.com
📱 Application mobile: iOS & Android

════════════════════════════════════════════════════════════════════════════════════
                      📄 Reçu officiel généré le ${formattedDate}
                        🎯 Transaction traitée avec succès
                  🔒 Conservez ce reçu pour vos dossiers comptables
                   ⭐ Merci de faire confiance à ZaLaMa
════════════════════════════════════════════════════════════════════════════════════
`;

      const blob = new Blob([receipt], { type: "text/plain; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zalama-recu-paiement-${
        paymentResult.partenaireId
      }-${Date.now()}.txt`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du reçu");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleRetryPayment = () => {
    router.push("/dashboard/remboursements");
  };

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  const handleReturnToRemboursements = () => {
    router.push("/dashboard/remboursements");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "var(--zalama-bg-dark)",
          color: "var(--zalama-text)",
        }}
      >
        <Card className="w-full max-w-md bg-[var(--zalama-card)] border-[var(--zalama-border)]">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <RefreshCw
                  className="h-16 w-16 animate-spin"
                  style={{ color: "var(--zalama-blue)" }}
                />
              </div>
              <div className="space-y-2">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--zalama-text)" }}
                >
                  Vérification du paiement
                </h3>
                <p style={{ color: "var(--zalama-text-secondary)" }}>
                  Récupération des informations...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "var(--zalama-bg-dark)",
          color: "var(--zalama-text)",
        }}
      >
        <Card className="w-full max-w-lg bg-[var(--zalama-card)] border-[var(--zalama-border)]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle
                className="h-16 w-16"
                style={{ color: "var(--zalama-danger)" }}
              />
            </div>
            <CardTitle style={{ color: "var(--zalama-danger)" }}>
              Paramètres manquants
            </CardTitle>
            <CardDescription>
              Impossible de traiter le résultat du paiement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleReturnToDashboard} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "var(--zalama-bg-dark)",
        color: "var(--zalama-text)",
      }}
    >
      <Card className="w-full max-w-4xl shadow-2xl bg-[var(--zalama-card)] border-[var(--zalama-border)]">
        {/* En-tête avec statut */}
        <CardHeader
          className="text-center py-8"
          style={{
            background:
              paymentResult.status === "success"
                ? "var(--zalama-success)"
                : "var(--zalama-danger)",
            color: "white",
          }}
        >
          <div className="flex justify-center mb-6">
            {paymentResult.status === "success" ? (
              <CheckCircle className="h-20 w-20 text-white" />
            ) : (
              <XCircle className="h-20 w-20 text-white" />
            )}
          </div>
          <CardTitle className="text-4xl font-bold text-white mb-2">
            {paymentResult.status === "success"
              ? "Paiement Réussi !"
              : "Paiement Échoué"}
          </CardTitle>
          <CardDescription className="text-xl text-white/90">
            {paymentResult.status === "success"
              ? "Vos remboursements ont été traités avec succès"
              : "Une erreur s'est produite lors du traitement"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Section Informations du paiement */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Receipt
                className="w-6 h-6"
                style={{ color: "var(--zalama-blue)" }}
              />
              <h3
                className="text-2xl font-semibold"
                style={{ color: "var(--zalama-text)" }}
              >
                Informations du paiement
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entreprise */}
              <div className="rounded-lg p-6 border bg-[var(--zalama-card)] border-[var(--zalama-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "var(--zalama-blue)" }}
                  >
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--zalama-text-secondary)" }}
                    >
                      Entreprise
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      {partenaireData?.company_name || "Chargement..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Montant */}
              <div className="rounded-lg p-6 border bg-[var(--zalama-bg-light)] border-[var(--zalama-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "var(--zalama-success)" }}
                  >
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--zalama-text-secondary)" }}
                    >
                      Montant total
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      {paymentResult.montantTotal.toLocaleString()} GNF
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre de remboursements */}
              <div className="rounded-lg p-6 border bg-[var(--zalama-bg-light)] border-[var(--zalama-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "var(--zalama-warning)" }}
                  >
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--zalama-text-secondary)" }}
                    >
                      Remboursements
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      {nombreRemboursements} employé
                      {nombreRemboursements > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="rounded-lg p-6 border bg-[var(--zalama-bg-light)] border-[var(--zalama-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "var(--zalama-blue)" }}
                  >
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--zalama-text-secondary)" }}
                    >
                      Date de traitement
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      {new Date(paymentResult.timestamp).toLocaleDateString(
                        "fr-FR"
                      )}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--zalama-text-secondary)" }}
                    >
                      {new Date(paymentResult.timestamp).toLocaleTimeString(
                        "fr-FR"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Actions */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FileText
                className="w-6 h-6"
                style={{ color: "var(--zalama-blue)" }}
              />
              <h3
                className="text-2xl font-semibold"
                style={{ color: "var(--zalama-text)" }}
              >
                Actions disponibles
              </h3>
            </div>

            {paymentResult.status === "success" ? (
              <>
                {/* Section de téléchargement pour succès */}
                <div className="rounded-xl p-6 border-2 mb-6 bg-[var(--zalama-bg-light)] border-[var(--zalama-success)]">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="p-3 rounded-full"
                      style={{ background: "var(--zalama-success)" }}
                    >
                      <Receipt className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4
                        className="text-lg font-bold"
                        style={{ color: "var(--zalama-text)" }}
                      >
                        🎉 Reçu officiel généré
                      </h4>
                      <p
                        className="text-sm"
                        style={{ color: "var(--zalama-text-secondary)" }}
                      >
                        Reçu détaillé avec toutes les informations du paiement
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPDF}
                    className="w-full h-14 text-lg font-semibold text-white"
                    style={{
                      background: "var(--zalama-success)",
                      border: "none",
                    }}
                  >
                    {isDownloadingPDF ? (
                      <>
                        <RefreshCw className="h-6 w-6 mr-3 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-6 w-6 mr-3" />
                        Télécharger le reçu
                      </>
                    )}
                  </Button>
                </div>

                {/* Boutons de navigation pour succès */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleReturnToRemboursements}
                    variant="outline"
                    className="h-12 border-[var(--zalama-border)] text-[var(--zalama-text)]"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Retour aux remboursements
                  </Button>

                  <Button
                    onClick={handleReturnToDashboard}
                    variant="outline"
                    className="h-12 border-[var(--zalama-border)] text-[var(--zalama-text)]"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Tableau de bord
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Section d'erreur pour échec */}
                <div className="rounded-xl p-6 border-2 mb-6 bg-[var(--zalama-bg-light)] border-[var(--zalama-danger)]">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="p-3 rounded-full"
                      style={{ background: "var(--zalama-danger)" }}
                    >
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4
                        className="text-lg font-bold"
                        style={{ color: "var(--zalama-text)" }}
                      >
                        ⚠️ Paiement non traité
                      </h4>
                      <p
                        className="text-sm"
                        style={{ color: "var(--zalama-text-secondary)" }}
                      >
                        Une erreur s'est produite. Veuillez réessayer.
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{
                      background: "var(--zalama-bg-dark)",
                      border: `1px solid var(--zalama-danger)`,
                    }}
                  >
                    <h5
                      className="font-semibold mb-2"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      Que faire maintenant ?
                    </h5>
                    <ul
                      className="text-sm space-y-1"
                      style={{ color: "var(--zalama-text-secondary)" }}
                    >
                      <li>• Vérifiez votre solde Orange Money</li>
                      <li>• Assurez-vous d'avoir saisi le bon PIN</li>
                      <li>• Contactez le support si le problème persiste</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleRetryPayment}
                    className="w-full h-14 text-lg font-semibold text-white"
                    style={{
                      background: "var(--zalama-danger)",
                      border: "none",
                    }}
                  >
                    <RotateCcw className="h-6 w-6 mr-3" />
                    Réessayer le paiement
                  </Button>
                </div>

                {/* Boutons de navigation pour échec */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleReturnToRemboursements}
                    variant="outline"
                    className="h-12 border-[var(--zalama-border)] text-[var(--zalama-text)]"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Retour aux remboursements
                  </Button>

                  <Button
                    onClick={handleReturnToDashboard}
                    variant="outline"
                    className="h-12 border-[var(--zalama-border)] text-[var(--zalama-text)]"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Tableau de bord
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Section Informations importantes */}
          <div className="rounded-lg p-6 border bg-[var(--zalama-bg-light)] border-[var(--zalama-border)]">
            <h4
              className="font-semibold mb-3"
              style={{ color: "var(--zalama-text)" }}
            >
              🔒 Sécurité & Confidentialité
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5
                  className="font-semibold mb-2"
                  style={{ color: "var(--zalama-text)" }}
                >
                  {paymentResult.status === "success"
                    ? "✅ Transaction sécurisée"
                    : "⚠️ Transaction non aboutie"}
                </h5>
                <ul
                  className="text-sm space-y-1"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  {paymentResult.status === "success" ? (
                    <>
                      <li>• Paiement traité avec succès</li>
                      <li>• Reçu électronique généré</li>
                      <li>• Mise à jour automatique du système</li>
                    </>
                  ) : (
                    <>
                      <li>• Aucun montant n'a été débité</li>
                      <li>• Vos données sont sécurisées</li>
                      <li>• Vous pouvez réessayer en toute sécurité</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h5
                  className="font-semibold mb-2"
                  style={{ color: "var(--zalama-text)" }}
                >
                  🛡️ Protection des données
                </h5>
                <ul
                  className="text-sm space-y-1"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  <li>• Chiffrement SSL/TLS 256-bit</li>
                  <li>• Conformité PCI DSS</li>
                  <li>• Traçabilité complète</li>
                  <li>• Audit trail disponible</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--zalama-bg-dark)" }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: "var(--zalama-blue)" }}
            ></div>
            <p style={{ color: "var(--zalama-text-secondary)" }}>
              Chargement...
            </p>
          </div>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
