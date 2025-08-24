import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, approverId, approverRole, reason } = body;

    // Validation des données requises
    if (!requestId || !action || !approverId || !approverRole) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Données manquantes: requestId, action, approverId et approverRole sont requis",
        },
        { status: 400 }
      );
    }

    // Validation des valeurs
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Action invalide: doit être 'approve' ou 'reject'",
        },
        { status: 400 }
      );
    }

    if (!["rh", "responsable"].includes(approverRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Rôle invalide: doit être 'rh' ou 'responsable'",
        },
        { status: 400 }
      );
    }

    // Récupérer la demande d'avance
    const { data: demande, error: demandeError } = await supabase
      .from("salary_advance_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (demandeError || !demande) {
      return NextResponse.json(
        {
          success: false,
          message: "Demande non trouvée",
        },
        { status: 404 }
      );
    }

    // Vérifier que la demande est en attente RH/Responsable
    if (demande.statut !== "En attente RH/Responsable") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cette demande ne nécessite pas d'approbation RH/Responsable",
        },
        { status: 400 }
      );
    }

    // Mettre à jour le statut de la demande
    const newStatus = action === "approve" ? "Validé" : "Rejeté";
    const updateData: any = {
      statut: newStatus,
      date_validation: action === "approve" ? new Date().toISOString() : null,
      date_rejet: action === "reject" ? new Date().toISOString() : null,
      motif_rejet: action === "reject" ? reason : null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("salary_advance_requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("Erreur lors de la mise à jour:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la mise à jour de la demande",
        },
        { status: 500 }
      );
    }

    // Si approuvée, initier le paiement automatique
    if (action === "approve") {
      // TODO: Logique pour initier le paiement automatique
      console.log(
        "Demande approuvée, paiement automatique à initier pour:",
        requestId
      );
    }

    // Enregistrer l'action dans l'historique (si une table d'historique existe)
    try {
      await supabase.from("historique_remboursements").insert({
        remboursement_id: requestId,
        action: `Demande ${
          action === "approve" ? "approuvée" : "rejetée"
        } par ${approverRole}`,
        description: reason || `Action effectuée par ${approverRole}`,
        utilisateur_id: approverId,
        created_at: new Date().toISOString(),
      });
    } catch (historyError) {
      // L'historique n'est pas critique, on continue
      console.log(
        "Erreur lors de l'enregistrement de l'historique:",
        historyError
      );
    }

    return NextResponse.json({
      success: true,
      message: `Demande ${
        action === "approve" ? "approuvée" : "rejetée"
      } avec succès`,
      data: {
        requestId,
        newStatus,
        approverRole,
        reason,
      },
    });
  } catch (error) {
    console.error("Erreur lors du traitement de l'approbation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}
