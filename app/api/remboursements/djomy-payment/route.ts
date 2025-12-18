import { NextRequest, NextResponse } from "next/server";
// TODO: Migrer vers le nouveau backend
// import { apiClient } from "@/lib/api-client";
import { djomyService } from "@/lib/djomyService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { remboursementId, paymentMethod = "OM" } = body;

    if (!remboursementId) {
      return NextResponse.json(
        { error: "ID de remboursement requis" },
        { status: 400 }
      );
    }

    // TODO: Migrer vers le nouveau backend
    // Récupérer les informations du remboursement
    // const remboursement = await apiClient.get(API_ROUTES.reimbursements.get(remboursementId));
    
    // Pour l'instant, retourner une erreur car non migré
    return NextResponse.json(
      { error: "Cette fonctionnalité est en cours de migration vers le nouveau backend" },
      { status: 501 }
    );
    
    /* Code original commenté
    if (remboursementError || !remboursement) {
      console.error("Erreur récupération remboursement:", remboursementError);
      return NextResponse.json(
        { error: "Remboursement non trouvé" },
        { status: 404 }
      );
    }
    */

    const employee = Array.isArray(remboursement.employee)
      ? remboursement.employee[0]
      : remboursement.employee;

    if (!employee?.telephone) {
      return NextResponse.json(
        { error: "Numéro de téléphone de l'employé manquant" },
        { status: 400 }
      );
    }

    // Créer le paiement via Djomy
    const paymentResponse = await djomyService.createRemboursementPayment({
      employeePhone: employee.telephone,
      amount: remboursement.montant_total_remboursement,
      employeeName: `${employee.nom} ${employee.prenom}`,
      remboursementId: remboursement.id,
      countryCode: "GN", // Par défaut Guinée
    });

    if (!paymentResponse.success) {
      console.error("Erreur création paiement Djomy:", paymentResponse);
      return NextResponse.json(
        {
          error:
            paymentResponse.message || "Erreur lors de la création du paiement",
        },
        { status: 500 }
      );
    }

    // Mettre à jour le remboursement avec les informations de transaction
    const { error: updateError } = await supabase
      .from("remboursements")
      .update({
        statut: "EN_ATTENTE",
        // Ajouter des champs pour stocker les informations Djomy si nécessaire
        date_remboursement_effectue: null,
      })
      .eq("id", remboursementId);

    if (updateError) {
      console.error("Erreur mise à jour remboursement:", updateError);
      // Ne pas retourner d'erreur car le paiement a été créé
    }

    return NextResponse.json({
      success: true,
      message: "Paiement initié avec succès",
      data: {
        transactionId: paymentResponse.data?.transactionId,
        paymentUrl: paymentResponse.data?.paymentUrl,
        remboursementId: remboursement.id,
        employeeName: `${employee.nom} ${employee.prenom}`,
        amount: remboursement.montant_total_remboursement,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'initiation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Méthode GET pour récupérer le statut d'un paiement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const remboursementId = searchParams.get("remboursementId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID de transaction requis" },
        { status: 400 }
      );
    }

    // Vérifier le statut via Djomy
    const statusResponse = await djomyService.checkPaymentStatus(transactionId);

    if (!statusResponse.success) {
      return NextResponse.json(
        {
          error:
            statusResponse.message ||
            "Erreur lors de la vérification du statut",
        },
        { status: 500 }
      );
    }

    // Si un remboursementId est fourni, mettre à jour le statut
    if (remboursementId && statusResponse.data) {
      let newStatus: string;
      let datePaiement: string | null = null;

      switch (statusResponse.data.status) {
        case "SUCCESS":
          newStatus = "PAYE";
          datePaiement = new Date().toISOString();
          break;
        case "FAILED":
          newStatus = "ECHOUE";
          break;
        default:
          newStatus = "EN_ATTENTE";
      }

      const { error: updateError } = await supabase
        .from("remboursements")
        .update({
          statut: newStatus,
          date_remboursement_effectue: datePaiement,
        })
        .eq("id", remboursementId);

      if (updateError) {
        console.error("Erreur mise à jour statut remboursement:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: statusResponse.data,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du statut:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
