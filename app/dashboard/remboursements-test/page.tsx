"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Types pour l'API Djomy
interface DjomyPaymentRequest {
  paymentMethod:
    | "MOMO"
    | "YMO"
    | "OM"
    | "PAYCARD"
    | "KULU"
    | "SOUTOURA"
    | "VISA"
    | "MC"
    | "AMEX";
  payerIdentifier: string;
  amount: number;
  countryCode: string;
  description?: string;
  merchantPaymentReference?: string;
}

interface DjomyPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: string;
    paymentUrl?: string;
  };
  error?: any;
}

interface DjomyPaymentStatus {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    paidAmount?: number;
    receivedAmount?: number;
    fees?: number;
    paymentMethod: string;
    merchantPaymentReference?: string;
    payerIdentifier: string;
    currency: string;
    createdAt: string;
  };
}

interface DjomyLinkRequest {
  amountToPay?: number;
  linkName?: string;
  phoneNumber?: string;
  description?: string;
  countryCode: string;
  usageType: "UNIQUE" | "MULTIPLE";
  expiresAt?: string;
  merchantReference?: string;
  usageLimit?: number;
}

interface DjomyLinkResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    paymentUrl: string;
    status: string;
  };
}

export default function RemboursementsTestPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<DjomyPaymentStatus | null>(
    null
  );
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");

  // États pour le formulaire de paiement
  const [paymentData, setPaymentData] = useState<DjomyPaymentRequest>({
    paymentMethod: "OM",
    payerIdentifier: "",
    amount: 0,
    countryCode: "GN",
    description: "",
    merchantPaymentReference: "",
  });

  // États pour le formulaire de lien de paiement
  const [linkData, setLinkData] = useState<DjomyLinkRequest>({
    amountToPay: 0,
    linkName: "",
    phoneNumber: "",
    description: "",
    countryCode: "GN",
    usageType: "UNIQUE",
    merchantReference: "",
  });

  // Fonction pour initier un paiement via notre API route
  const initiatePayment = async () => {
    setLoading(true);
    setPaymentStatus(null);

    try {
      console.log("💳 Initiation du paiement via API route:", paymentData);

      const response = await fetch("/api/djomy/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentData }),
      });

      if (!response.ok) {
        console.error(
          "❌ Erreur HTTP paiement:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("❌ Réponse d'erreur paiement:", errorText);
        toast.error("Erreur lors de l'initiation du paiement");
        return;
      }

      const data: DjomyPaymentResponse = await response.json();

      if (data.success && data.data) {
        setCurrentTransactionId(data.data.transactionId);
        setPaymentUrl(data.data.paymentUrl || "");
        toast.success("Paiement initié avec succès !");

        // Vérifier le statut immédiatement
        setTimeout(() => checkPaymentStatus(data.data.transactionId), 2000);
      } else {
        toast.error(
          `Erreur: ${data.message || "Erreur lors de l'initiation du paiement"}`
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'initiation du paiement:", error);
      toast.error("Erreur de connexion à l'API Djomy");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier le statut d'un paiement via notre API route
  const checkPaymentStatus = async (transactionId?: string) => {
    const id = transactionId || currentTransactionId;
    if (!id) {
      toast.error("Aucun ID de transaction disponible");
      return;
    }

    setLoading(true);

    try {
      console.log("🔍 Vérification statut via API route:", id);

      const response = await fetch(`/api/djomy/payments/${id}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "❌ Erreur HTTP statut:",
          response.status,
          response.statusText
        );
        toast.error("Erreur lors de la vérification du statut");
        return;
      }

      const data: DjomyPaymentStatus = await response.json();
      setPaymentStatus(data);

      if (data.success) {
        toast.success(`Statut: ${data.data?.status}`);
      } else {
        toast.error(`Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer un lien de paiement via notre API route
  const createPaymentLink = async () => {
    setLoading(true);
    setLinkUrl("");

    try {
      console.log("🔗 Création lien via API route:", linkData);

      const response = await fetch("/api/djomy/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkData }),
      });

      if (!response.ok) {
        console.error(
          "❌ Erreur HTTP lien:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("❌ Réponse d'erreur lien:", errorText);
        toast.error("Erreur lors de la création du lien");
        return;
      }

      const data: DjomyLinkResponse = await response.json();

      if (data.success && data.data) {
        setLinkUrl(data.data.paymentUrl);
        toast.success("Lien de paiement créé avec succès !");
      } else {
        toast.error(
          `Erreur: ${data.message || "Erreur lors de la création du lien"}`
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création du lien:", error);
      toast.error("Erreur de connexion à l'API Djomy");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour copier dans le presse-papiers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers !");
  };

  // Fonction pour ouvrir l'URL dans un nouvel onglet
  const openUrl = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* En-tête */}
      <div className="bg-white dark:bg-[var(--zalama-card)] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Test API Djomy - Remboursements
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Environnement Sandbox - Tests de paiement sécurisés
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded-full">
              SANDBOX
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Paiement Direct */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Paiement Direct
            </CardTitle>
            <CardDescription>
              Initier un paiement direct vers un numéro de téléphone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value: any) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      paymentMethod: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OM">Orange Money</SelectItem>
                    <SelectItem value="MOMO">MTN Mobile Money</SelectItem>
                    <SelectItem value="KULU">Kulu</SelectItem>
                    <SelectItem value="YMO">YMO</SelectItem>
                    <SelectItem value="PAYCARD">PayCard</SelectItem>
                    <SelectItem value="SOUTOURA">Soutoura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="countryCode">Pays</Label>
                <Select
                  value={paymentData.countryCode}
                  onValueChange={(value) =>
                    setPaymentData((prev) => ({ ...prev, countryCode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GN">Guinée (GN)</SelectItem>
                    <SelectItem value="CI">Côte d'Ivoire (CI)</SelectItem>
                    <SelectItem value="SN">Sénégal (SN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="payerIdentifier">Numéro de téléphone</Label>
              <Input
                id="payerIdentifier"
                type="tel"
                placeholder="00224623707722"
                value={paymentData.payerIdentifier}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    payerIdentifier: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="amount">Montant (GNF)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Remboursement avance salariale"
                value={paymentData.description}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="merchantReference">Référence marchand</Label>
              <Input
                id="merchantReference"
                placeholder="REF-001"
                value={paymentData.merchantPaymentReference}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    merchantPaymentReference: e.target.value,
                  }))
                }
              />
            </div>

            <Button
              onClick={initiatePayment}
              disabled={
                loading || !paymentData.payerIdentifier || !paymentData.amount
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Initier le paiement
                </>
              )}
            </Button>

            {/* Résultat du paiement */}
            {currentTransactionId && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    ID Transaction: {currentTransactionId}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(currentTransactionId)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {paymentUrl && (
                  <Button
                    size="sm"
                    onClick={() => openUrl(paymentUrl)}
                    className="w-full mt-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir la page de paiement
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkPaymentStatus()}
                  className="w-full mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Vérifier le statut
                </Button>
              </div>
            )}

            {/* Statut du paiement */}
            {paymentStatus && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {paymentStatus.data?.status === "SUCCESS" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : paymentStatus.data?.status === "PENDING" ? (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    Statut: {paymentStatus.data?.status}
                  </span>
                </div>
                {paymentStatus.data && (
                  <div className="text-sm space-y-1">
                    <div>Montant payé: {paymentStatus.data.paidAmount} GNF</div>
                    <div>
                      Montant reçu: {paymentStatus.data.receivedAmount} GNF
                    </div>
                    <div>Frais: {paymentStatus.data.fees} GNF</div>
                    <div>Méthode: {paymentStatus.data.paymentMethod}</div>
                    <div>
                      Date:{" "}
                      {new Date(paymentStatus.data.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Lien de Paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" />
              Lien de Paiement
            </CardTitle>
            <CardDescription>
              Créer un lien de paiement partageable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="linkName">Nom du lien</Label>
              <Input
                id="linkName"
                placeholder="Remboursement avance"
                value={linkData.linkName}
                onChange={(e) =>
                  setLinkData((prev) => ({ ...prev, linkName: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkAmount">Montant (GNF)</Label>
                <Input
                  id="linkAmount"
                  type="number"
                  placeholder="10000"
                  value={linkData.amountToPay}
                  onChange={(e) =>
                    setLinkData((prev) => ({
                      ...prev,
                      amountToPay: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="linkCountryCode">Pays</Label>
                <Select
                  value={linkData.countryCode}
                  onValueChange={(value) =>
                    setLinkData((prev) => ({ ...prev, countryCode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GN">Guinée (GN)</SelectItem>
                    <SelectItem value="CI">Côte d'Ivoire (CI)</SelectItem>
                    <SelectItem value="SN">Sénégal (SN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="linkPhone">Numéro de téléphone</Label>
              <Input
                id="linkPhone"
                type="tel"
                placeholder="00224623707722"
                value={linkData.phoneNumber}
                onChange={(e) =>
                  setLinkData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="linkDescription">Description</Label>
              <Textarea
                id="linkDescription"
                placeholder="Remboursement avance salariale"
                value={linkData.description}
                onChange={(e) =>
                  setLinkData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageType">Type d'usage</Label>
                <Select
                  value={linkData.usageType}
                  onValueChange={(value: any) =>
                    setLinkData((prev) => ({ ...prev, usageType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIQUE">Usage unique</SelectItem>
                    <SelectItem value="MULTIPLE">Usage multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="merchantRef">Référence marchand</Label>
                <Input
                  id="merchantRef"
                  placeholder="REF-LINK-001"
                  value={linkData.merchantReference}
                  onChange={(e) =>
                    setLinkData((prev) => ({
                      ...prev,
                      merchantReference: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={createPaymentLink}
              disabled={loading || !linkData.countryCode}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Créer le lien de paiement
                </>
              )}
            </Button>

            {/* Lien généré */}
            {linkUrl && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Lien de paiement généré
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(linkUrl)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => openUrl(linkUrl)}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir le lien de paiement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Informations importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Environnement Sandbox
              </h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Aucune vraie transaction financière</li>
                <li>• Données de test uniquement</li>
                <li>• Pas de frais réels</li>
                <li>• Tests sécurisés</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Méthodes de paiement
              </h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• OM : Orange Money</li>
                <li>• MOMO : MTN Mobile Money</li>
                <li>• KULU : Kulu Digital Pay</li>
                <li>• Autres méthodes en développement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
