import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/partner-approval`;

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'autorisation de la requête
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Token d\'autorisation manquant' },
        { status: 401 }
      );
    }

    // Récupérer le corps de la requête
    const body = await request.json();
    
    console.log('🔄 Proxy partner-approval - Données reçues:', body);

    // Vérifier que tous les champs requis sont présents
    if (!body.requestId || !body.action || !body.approverId || !body.approverRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données manquantes: requestId, action, approverId et approverRole sont requis',
          received: {
            requestId: body.requestId,
            action: body.action,
            approverId: body.approverId,
            approverRole: body.approverRole
          }
        },
        { status: 400 }
      );
    }

    // Faire la requête vers l'edge function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('📡 Réponse edge function:', {
      status: response.status,
      success: data.success,
      message: data.message || data.error
    });

    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Erreur proxy partner-approval:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}