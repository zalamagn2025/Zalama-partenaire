import { NextRequest, NextResponse } from "next/server";
// TODO: Migrer vers le nouveau backend
// import { apiClient } from "@/lib/api-client";
// import { API_ROUTES } from "@/config/api";

// Types pour les webhooks Djomy
interface DjomyWebhookData {
  message: string;
  eventType:
    | "payment.created"
    | "payment.pending"
    | "payment.success"
    | "payment.failed";
  data: {
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
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DjomyWebhookData = await request.json();

    console.log("Webhook Djomy reçu:", body);

    // Vérifier que c'est un événement de paiement
    if (!body.eventType || !body.data) {
      return NextResponse.json(
        { error: "Format de webhook invalide" },
        { status: 400 }
      );
    }

    const { eventType, data } = body;

    // Extraire l'ID de remboursement depuis la référence marchand
    const merchantRef = data.merchantPaymentReference;
    let remboursementId: string | null = null;

    if (merchantRef) {
      // Format attendu: REMBOURSEMENT-{id} ou LINK-REMBOURSEMENT-{id}
      const match = merchantRef.match(
        /(?:REMBOURSEMENT|LINK-REMBOURSEMENT)-(.+)/
      );
      if (match) {
        remboursementId = match[1];
      }
    }

    if (!remboursementId) {
      console.warn(
        "Aucun ID de remboursement trouvé dans la référence:",
        merchantRef
      );
      return NextResponse.json(
        { error: "Référence marchand invalide" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut du remboursement selon l'événement
    let newStatus: string;
    let datePaiement: string | null = null;

    switch (eventType) {
      case "payment.success":
        newStatus = "PAYE";
        datePaiement = new Date().toISOString();
        break;
      case "payment.failed":
        newStatus = "ECHOUE";
        break;
      case "payment.pending":
        newStatus = "EN_ATTENTE";
        break;
      default:
        newStatus = "EN_ATTENTE";
    }

    // TODO: Migrer vers le nouveau backend
    // Mettre à jour le remboursement dans la base de données
    // const updateData = {
    //   statut: newStatus,
    //   date_remboursement_effectue: datePaiement,
    //   montant_transaction: data.paidAmount || 0,
    //   frais_service: data.fees || 0,
    //   reference_paiement: data.transactionId,
    //   updated_at: new Date().toISOString(),
    // };
    // await apiClient.put(API_ROUTES.reimbursements.update(remboursementId), updateData);
    
    console.log(`Webhook Djomy reçu pour remboursement ${remboursementId}, statut: ${newStatus}`);

    console.log(
      `Remboursement ${remboursementId} mis à jour avec le statut: ${newStatus}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Webhook traité avec succès. Statut: ${newStatus}`,
        remboursementId,
        newStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors du traitement du webhook Djomy:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Méthode GET pour tester la route
export async function GET() {
  return NextResponse.json(
    {
      message: "Webhook Djomy actif",
      status: "ready",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
