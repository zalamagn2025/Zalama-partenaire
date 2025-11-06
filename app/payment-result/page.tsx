"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Download,
  Loader2,
  Receipt,
  Building2,
  DollarSign,
  Hash,
  Calendar,
  FileCheck,
  AlertTriangle,
  Home,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";

type PaymentStatus = "pending" | "success" | "failed";

interface PaymentResult {
  status: PaymentStatus;
  partenaireId: string;
  montantTotal: number;
  type: string;
  timestamp: string;
  referenceTransaction?: string;
}

interface PartenaireData {
  id: string;
  company_name: string;
  logo_url?: string;
}

interface RemboursementStatus {
  totalRemboursements: number;
  remboursementsPayes: number;
  pourcentagePaye: number;
  statut: "PAYE" | "EN_ATTENTE" | "PARTIEL";
}

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { theme } = useTheme();

  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [partenaireData, setPartenaireData] = useState<PartenaireData | null>(
    null
  );
  const [remboursementStatus, setRemboursementStatus] =
    useState<RemboursementStatus | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Classes dynamiques pour le thème
  const getBgClass = () => {
    return theme === "dark"
      ? "bg-gradient-to-br from-[#0a1525] via-[#061020] to-[#0e1e36]"
      : "bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50";
  };

  const getCardClass = () => {
    return theme === "dark"
      ? "bg-[#0c1a2e] border-[#1e3a70] shadow-2xl shadow-black/20"
      : "bg-white border-gray-200 shadow-xl shadow-blue-100/20";
  };

  const getTextClass = () => {
    return theme === "dark" ? "text-[#e5e7ef]" : "text-gray-900";
  };

  const getSecondaryTextClass = () => {
    return theme === "dark" ? "text-[#a0aec0]" : "text-gray-600";
  };

  const getAccentClass = () => {
    return "bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]";
  };

  useEffect(() => {
    const partenaireId = searchParams.get("partenaire_id");
    const montantTotal = searchParams.get("montant_total");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    if (partenaireId && montantTotal && type) {
      const result: PaymentResult = {
        status: "pending", // Toujours pending au début
        partenaireId,
        montantTotal: parseFloat(montantTotal),
        type,
        timestamp: new Date().toISOString(),
        referenceTransaction: `ZLM-${Date.now()}`,
      };

      setPaymentResult(result);
      initializePaymentFlow(partenaireId);
    } else {
      setIsLoading(false);
      toast.error("Paramètres de paiement manquants");
    }
  }, [searchParams]);

  const initializePaymentFlow = async (partenaireId: string) => {
    try {
      // 1. Récupérer les données du partenaire
      await fetchPartenaireData(partenaireId);

      // 2. Démarrer la vérification du statut des remboursements
      startStatusChecking(partenaireId);
    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error);
      setIsLoading(false);
    }
  };

  const fetchPartenaireData = async (partenaireId: string) => {
    const { data, error } = await supabase
      .from("partners")
      .select("id, company_name, logo_url")
      .eq("id", partenaireId)
      .single();

    if (error) {
      console.error("Erreur partenaire:", error);
      return;
    }

    setPartenaireData(data);
  };

  const checkRemboursementsStatus = async (
    partenaireId: string
  ): Promise<RemboursementStatus> => {
    const { data, error } = await supabase
      .from("remboursements")
      .select("statut")
      .eq("partenaire_id", partenaireId);

    if (error) {
      throw error;
    }

    const totalRemboursements = data?.length || 0;
    const remboursementsPayes =
      data?.filter((r) => r.statut === "PAYE").length || 0;
    const pourcentagePaye =
      totalRemboursements > 0
        ? (remboursementsPayes / totalRemboursements) * 100
        : 0;

    let statut: "PAYE" | "EN_ATTENTE" | "PARTIEL" = "EN_ATTENTE";
    if (pourcentagePaye === 100) {
      statut = "PAYE";
    } else if (pourcentagePaye > 0) {
      statut = "PARTIEL";
    }

    return {
      totalRemboursements,
      remboursementsPayes,
      pourcentagePaye,
      statut,
    };
  };

  const startStatusChecking = (partenaireId: string) => {
    setIsCheckingStatus(true);
    setIsLoading(false);

    const checkStatus = async () => {
      try {
        const status = await checkRemboursementsStatus(partenaireId);
        setRemboursementStatus(status);

        if (status.statut === "PAYE") {
          // Tous les remboursements sont payés -> Succès
          setPaymentResult((prev) =>
            prev ? { ...prev, status: "success" } : null
          );
          setIsCheckingStatus(false);
          setShowSuccessModal(true);
          return;
        }

        // Continue à vérifier pendant 30 secondes max
        const currentTime = Date.now();
        const startTime = paymentResult?.timestamp
          ? new Date(paymentResult.timestamp).getTime()
          : currentTime;

        if (currentTime - startTime > 30000) {
          // 30 secondes
          // Timeout -> Échec
          setPaymentResult((prev) =>
            prev ? { ...prev, status: "failed" } : null
          );
          setIsCheckingStatus(false);
          setShowFailureModal(true);
          return;
        }

        // Continuer à vérifier
        const newTimeoutId = setTimeout(checkStatus, 3000); // Vérifier toutes les 3 secondes
        setTimeoutId(newTimeoutId);
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        setPaymentResult((prev) =>
          prev ? { ...prev, status: "failed" } : null
        );
        setIsCheckingStatus(false);
        setShowFailureModal(true);
      }
    };

    checkStatus();
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const handleDownloadPDF = async () => {
    if (!paymentResult || !partenaireData) return;

    setIsDownloadingPDF(true);

    try {
      // Créer une nouvelle instance jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const receiptDate = new Date(paymentResult.timestamp);
      const formattedDate = receiptDate.toLocaleDateString("fr-FR");
      const formattedTime = receiptDate.toLocaleTimeString("fr-FR");

      const gnfFormatter = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
          return "0 GNF";
        }
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "GNF",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      // Couleurs simples
      const zalamaBlue: [number, number, number] = [59, 130, 246];
      const statusColor: [number, number, number] =
        paymentResult.status === "success" ? [16, 185, 129] : [239, 68, 68];
      const textColor: [number, number, number] = [31, 41, 55];

      // === HEADER SIMPLE ===
      pdf.setFillColor(...zalamaBlue);
      pdf.rect(0, 0, 210, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("ZALAMA", 105, 16, { align: "center" });

      // === TITRE ===
      pdf.setTextColor(...textColor);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("REÇU DE PAIEMENT", 105, 40, { align: "center" });

      // === STATUT ===
      let currentY = 55;
      pdf.setFillColor(...statusColor);
      pdf.rect(50, currentY - 5, 110, 12, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      const statusText =
        paymentResult.status === "success" ? "SUCCÈS" : "ÉCHEC";
      pdf.text(statusText, 105, currentY + 2, { align: "center" });

      // === INFORMATIONS ESSENTIELLES ===
      currentY = 80;
      pdf.setTextColor(...textColor);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      const essentialInfo = [
        [`Référence:`, paymentResult.referenceTransaction || "N/A"],
        [`Date:`, `${formattedDate} ${formattedTime}`],
        [`Entreprise:`, partenaireData.company_name],
        [`Montant:`, gnfFormatter(paymentResult.montantTotal)],
      ];

      essentialInfo.forEach(([label, value]) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(label, 20, currentY);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, 70, currentY);
        currentY += 10;
      });

      // === REMBOURSEMENTS (seulement si disponible) ===
      if (remboursementStatus && remboursementStatus.totalRemboursements > 0) {
        currentY += 15;
        pdf.setFont("helvetica", "bold");
        pdf.text("REMBOURSEMENTS:", 20, currentY);

        currentY += 8;
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${remboursementStatus.remboursementsPayes}/${
            remboursementStatus.totalRemboursements
          } payés (${remboursementStatus.pourcentagePaye.toFixed(0)}%)`,
          20,
          currentY
        );
      }

      // === FOOTER MINIMAL ===
      currentY = 250;
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("ZaLaMa Financial Solutions", 105, currentY, {
        align: "center",
      });
      pdf.text("support@zalama.com", 105, currentY + 6, { align: "center" });

      // === TÉLÉCHARGEMENT ===
      const fileName = `zalama-recu-${paymentResult.referenceTransaction}.pdf`;
      pdf.save(fileName);

      toast.success("📄 Reçu PDF téléchargé !", {
        description: "Reçu simple et épuré généré.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erreur lors de la génération PDF:", error);
      toast.error("❌ Erreur de génération PDF");
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

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${getBgClass()} flex items-center justify-center p-4`}
      >
        <div className="text-center">
          <div className="relative mb-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#3b82f6]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] opacity-20"></div>
            </div>
          </div>
          <h2 className={`text-xl font-semibold ${getTextClass()} mb-2`}>
            Initialisation du paiement
          </h2>
          <p className={getSecondaryTextClass()}>
            Chargement des informations sécurisées...
          </p>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div
        className={`min-h-screen ${getBgClass()} flex items-center justify-center p-4`}
      >
        <Card className={`w-full max-w-md ${getCardClass()}`}>
          <CardHeader className="text-center pb-4">
            <AlertTriangle className="h-16 w-16 text-[#ef4444] mx-auto mb-4" />
            <CardTitle className="text-[#ef4444] text-xl">
              Erreur de Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className={`${getSecondaryTextClass()} leading-relaxed`}>
              Impossible de récupérer les informations de paiement. Veuillez
              vérifier votre lien ou contacter le support.
            </p>
            <Button
              onClick={handleReturnToDashboard}
              className={`w-full ${getAccentClass()} text-white hover:opacity-90 transition-all duration-200`}
            >
              <Home className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getBgClass()} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header avec gradient */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleReturnToDashboard}
            className={`${getSecondaryTextClass()} hover:${getTextClass()} hover:bg-[#3b82f6]/10 transition-all duration-200`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-[#3b82f6] mr-2" />
              <h1 className={`text-3xl font-bold ${getTextClass()}`}>
                Résultat du Paiement
              </h1>
              <Sparkles className="h-6 w-6 text-[#3b82f6] ml-2" />
            </div>
            <div className="flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-[#10b981] mr-2" />
              <p className={`text-sm ${getSecondaryTextClass()}`}>
                Réf: {paymentResult.referenceTransaction}
              </p>
            </div>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>

        {/* Status Card Principal */}
        <Card className={`${getCardClass()} overflow-hidden`}>
          <div className={`h-2 ${getAccentClass()}`}></div>
          <CardContent className="p-10">
            <div className="text-center space-y-6">
              {isCheckingStatus ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] opacity-20 animate-pulse"></div>
                    <Loader2 className="h-20 w-20 animate-spin mx-auto text-[#3b82f6] relative z-10" />
                  </div>
                  <div className="space-y-4">
                    <h2 className={`text-2xl font-bold ${getTextClass()}`}>
                      Vérification en cours...
                    </h2>
                    <p className={`${getSecondaryTextClass()} text-lg`}>
                      Nous vérifions le statut de vos remboursements en temps
                      réel
                    </p>

                    {/* Barre de progression stylée */}
                    <div className="max-w-md mx-auto">
                      <div
                        className={`bg-gray-200 dark:bg-[#1e3a70] rounded-full h-3 overflow-hidden`}
                      >
                        <div
                          className={`h-full ${getAccentClass()} transition-all duration-500 ease-out relative`}
                          style={{
                            width: `${
                              remboursementStatus?.pourcentagePaye || 0
                            }%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className={getSecondaryTextClass()}>
                          Progression
                        </span>
                        <span className={`font-medium ${getTextClass()}`}>
                          {remboursementStatus?.pourcentagePaye.toFixed(0) || 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    {paymentResult.status === "success" ? (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-pulse"></div>
                        <CheckCircle2 className="h-24 w-24 text-[#10b981] mx-auto relative z-10" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-[#ef4444]/20 animate-pulse"></div>
                        <XCircle className="h-24 w-24 text-[#ef4444] mx-auto relative z-10" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h2 className={`text-3xl font-bold ${getTextClass()}`}>
                      {paymentResult.status === "success"
                        ? "🎉 Paiement Réussi !"
                        : "❌ Paiement Échoué"}
                    </h2>
                    <Badge
                      variant={
                        paymentResult.status === "success"
                          ? "success"
                          : "error"
                      }
                      className={`px-6 py-2 text-lg font-semibold ${
                        paymentResult.status === "success"
                          ? "bg-[#10b981] hover:bg-[#0d9570]"
                          : "bg-[#ef4444] hover:bg-[#dc2626]"
                      }`}
                    >
                      {paymentResult.status === "success"
                        ? "✅ SUCCÈS"
                        : "❌ ÉCHEC"}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className={getCardClass()}>
          <CardHeader className="pb-4">
            <CardTitle
              className={`flex items-center text-xl ${getTextClass()}`}
            >
              <Receipt className="h-6 w-6 mr-3 text-[#3b82f6]" />
              Détails de la Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-[#3b82f6]/10`}>
                    <Building2 className="h-5 w-5 text-[#3b82f6]" />
                  </div>
                  <div>
                    <p className={`text-sm ${getSecondaryTextClass()} mb-1`}>
                      Partenaire
                    </p>
                    <p className={`font-semibold text-lg ${getTextClass()}`}>
                      {partenaireData?.company_name || "Chargement..."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-[#10b981]/10`}>
                    <DollarSign className="h-5 w-5 text-[#10b981]" />
                  </div>
                  <div>
                    <p className={`text-sm ${getSecondaryTextClass()} mb-1`}>
                      Montant Total
                    </p>
                    <p className={`font-bold text-2xl ${getTextClass()}`}>
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "GNF",
                        minimumFractionDigits: 0,
                      }).format(paymentResult.montantTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-[#f59e0b]/10`}>
                    <Hash className="h-5 w-5 text-[#f59e0b]" />
                  </div>
                  <div>
                    <p className={`text-sm ${getSecondaryTextClass()} mb-1`}>
                      Référence Transaction
                    </p>
                    <p
                      className={`font-mono text-sm font-medium ${getTextClass()} bg-gray-100 dark:bg-[#1e3a70] px-3 py-1 rounded`}
                    >
                      {paymentResult.referenceTransaction}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-[#8b5cf6]/10`}>
                    <Calendar className="h-5 w-5 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <p className={`text-sm ${getSecondaryTextClass()} mb-1`}>
                      Date et Heure
                    </p>
                    <p className={`font-medium ${getTextClass()}`}>
                      {new Date(paymentResult.timestamp).toLocaleString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {remboursementStatus && (
              <>
                <Separator className="my-6" />
                <div
                  className={`${
                    theme === "dark" ? "bg-[#0e1e36]" : "bg-blue-50"
                  } rounded-xl p-6`}
                >
                  <h4
                    className={`font-semibold text-lg mb-4 flex items-center ${getTextClass()}`}
                  >
                    <FileCheck className="h-5 w-5 mr-2 text-[#3b82f6]" />
                    Statut des Remboursements
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${getTextClass()} mb-1`}
                      >
                        {remboursementStatus.totalRemboursements}
                      </div>
                      <p className={`text-sm ${getSecondaryTextClass()}`}>
                        Total
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#10b981] mb-1">
                        {remboursementStatus.remboursementsPayes}
                      </div>
                      <p className={`text-sm ${getSecondaryTextClass()}`}>
                        Payés
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#3b82f6] mb-1">
                        {remboursementStatus.pourcentagePaye.toFixed(0)}%
                      </div>
                      <p className={`text-sm ${getSecondaryTextClass()}`}>
                        Complété
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] hover:from-[#2563eb] hover:to-[#3b82f6] text-white transition-all duration-200"
            size="lg"
          >
            {isDownloadingPDF ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            Télécharger le Reçu PDF
          </Button>

          {paymentResult.status === "failed" && (
            <Button
              onClick={handleRetryPayment}
              className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#d97706] hover:to-[#ea580c] text-white"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Réessayer le Paiement
            </Button>
          )}

          <Button
            onClick={handleReturnToDashboard}
            variant={paymentResult.status === "success" ? "default" : "outline"}
            className={`flex-1 h-12 text-base font-medium ${
              paymentResult.status === "success"
                ? "bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white"
                : `border-2 ${
                    theme === "dark"
                      ? "border-[#1e3a70] hover:bg-[#0e1e36]"
                      : "border-gray-300 hover:bg-gray-50"
                  }`
            } transition-all duration-200`}
            size="lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Tableau de Bord
          </Button>
        </div>
      </div>

      {/* Success Modal avec fond fixe */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className={`max-w-md ${getCardClass()} border-2 border-[#10b981]/20`}
          style={{
            backgroundColor: theme === "dark" ? "#0c1a2e" : "#ffffff",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: -1 }}
          />
          <DialogHeader>
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping"></div>
                <CheckCircle2 className="h-16 w-16 text-[#10b981] mx-auto relative z-10" />
              </div>
              <DialogTitle className="text-[#10b981] text-2xl font-bold">
                🎉 Paiement Réussi !
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center space-y-6 pt-4">
            <p className={`${getSecondaryTextClass()} text-lg leading-relaxed`}>
              Félicitations ! Tous vos remboursements ont été traités avec
              succès par ZaLaMa Financial.
            </p>
            <div className="bg-gradient-to-r from-[#10b981]/10 to-[#059669]/10 rounded-xl p-4 border border-[#10b981]/20">
              <p className="text-[#10b981] font-semibold">
                ✅ <strong>{remboursementStatus?.remboursementsPayes}</strong>{" "}
                remboursement(s) effectué(s)
              </p>
              <p className={`text-sm ${getSecondaryTextClass()} mt-1`}>
                Transaction sécurisée et tracée
              </p>
            </div>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full h-12 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold text-base"
            >
              Parfait ! Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Failure Modal avec fond fixe */}
      <Dialog open={showFailureModal} onOpenChange={setShowFailureModal}>
        <DialogContent
          className={`max-w-md ${getCardClass()} border-2 border-[#ef4444]/20`}
          style={{
            backgroundColor: theme === "dark" ? "#0c1a2e" : "#ffffff",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: -1 }}
          />
          <DialogHeader>
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-[#ef4444]/20 animate-pulse"></div>
                <XCircle className="h-16 w-16 text-[#ef4444] mx-auto relative z-10" />
              </div>
              <DialogTitle className="text-[#ef4444] text-2xl font-bold">
                ❌ Paiement Échoué
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center space-y-6 pt-4">
            <p className={`${getSecondaryTextClass()} text-lg leading-relaxed`}>
              Le traitement de vos remboursements a échoué ou a pris trop de
              temps. Notre équipe technique a été notifiée.
            </p>
            <div className="bg-gradient-to-r from-[#ef4444]/10 to-[#dc2626]/10 rounded-xl p-4 border border-[#ef4444]/20">
              <p className="text-[#ef4444] font-semibold text-sm">
                💡 Suggestions: Vérifiez votre connexion ou contactez le support
                ZaLaMa
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRetryPayment}
                className="flex-1 h-12 bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#d97706] hover:to-[#ea580c] text-white font-semibold"
              >
                🔄 Réessayer
              </Button>
              <Button
                onClick={() => setShowFailureModal(false)}
                variant="outline"
                className={`flex-1 h-12 border-2 font-semibold ${
                  theme === "dark"
                    ? "border-[#1e3a70] hover:bg-[#0e1e36]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#0a1525] via-[#061020] to-[#0e1e36] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#3b82f6] mx-auto mb-4" />
            <p className="text-[#a0aec0] text-lg">
              Chargement sécurisé ZaLaMa...
            </p>
          </div>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
