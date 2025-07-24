import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Mettre à jour le statut du remboursement dans la base de données
    if (remboursement_id) {
      const updateData: any = {
        statut: status === 'success' || status === 'completed' ? 'PAYE' : 'EN_ATTENTE',
        date_remboursement_effectue: status === 'success' || status === 'completed' ? new Date().toISOString() : null,
        transaction_id: transaction_id,
        message_paiement: message
      };

      const { error } = await supabase
        .from('remboursements')
        .update(updateData)
        .eq('id', remboursement_id);

      if (error) {
        console.error('Erreur mise à jour remboursement:', error);
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
      }
    }

    // Si c'est un paiement en lot, mettre à jour tous les remboursements du partenaire
    if (partenaire_id && status === 'success') {
      const { error } = await supabase
        .from('remboursements')
        .update({
          statut: 'PAYE',
          date_remboursement_effectue: new Date().toISOString(),
          transaction_id: transaction_id,
          message_paiement: message
        })
        .eq('partenaire_id', partenaire_id)
        .eq('statut', 'EN_ATTENTE');

      if (error) {
        console.error('Erreur mise à jour remboursements en lot:', error);
        return NextResponse.json({ error: 'Erreur mise à jour en lot' }, { status: 500 });
      }
    }

    // Envoyer une notification au partenaire (optionnel)
    if (partenaire_id) {
      await supabase
        .from('notifications')
        .insert({
          partenaire_id: partenaire_id,
          titre: status === 'success' ? 'Paiement réussi' : 'Paiement échoué',
          message: message || (status === 'success' ? 'Votre paiement a été traité avec succès' : 'Le paiement a échoué'),
          type: status === 'success' ? 'success' : 'error',
          lu: false
        });
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