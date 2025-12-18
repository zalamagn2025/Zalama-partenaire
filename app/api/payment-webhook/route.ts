import { NextRequest, NextResponse } from 'next/server';
// TODO: Migrer vers le nouveau backend
// import { apiClient } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Webhook reçu:', body);

    // Vérifier la signature du webhook (à implémenter selon la documentation de Lengopay)
    // const signature = request.headers.get('x-lengopay-signature');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    // }

    const {
      transaction_id,
      status,
      amount,
      currency,
      reference,
      remboursement_id,
      partenaire_id,
      message
    } = body;

    // TODO: Migrer vers le nouveau backend
    // Mettre à jour le statut du remboursement dans la base de données
    if (remboursement_id) {
      // const updateData: any = {
      //   statut: status === 'success' || status === 'completed' ? 'PAYE' : 'EN_ATTENTE',
      //   date_remboursement_effectue: status === 'success' || status === 'completed' ? new Date().toISOString() : null,
      //   transaction_id: transaction_id,
      //   message_paiement: message
      // };
      // await apiClient.put(API_ROUTES.reimbursements.update(remboursement_id), updateData);
      console.log('Webhook reçu pour remboursement:', remboursement_id, status);
    }

    // Si c'est un paiement en lot, mettre à jour tous les remboursements du partenaire
    if (partenaire_id && status === 'success') {
      // TODO: Migrer vers le nouveau backend
      console.log('Paiement en lot pour partenaire:', partenaire_id);
    }

    // Envoyer une notification au partenaire (optionnel)
    if (partenaire_id) {
      // TODO: Migrer vers le nouveau backend
      console.log('Notification pour partenaire:', partenaire_id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// Fonction pour vérifier la signature (à implémenter selon la documentation de Lengopay)
function verifySignature(payload: any, signature: string | null): boolean {
  // TODO: Implémenter la vérification de signature selon la documentation de Lengopay
  // Cette fonction doit vérifier que le webhook provient bien de Lengopay
  return true; // Temporaire
} 