import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PARTNER_REIMBURSEMENTS_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-reimbursements`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const url = `${PARTNER_REIMBURSEMENTS_BASE_URL}${queryString ? `?${queryString}` : ''}`;

  const accessToken = request.headers.get('Authorization');

  // ✅ Validation du token
  if (!accessToken) {
    console.error('❌ partner-reimbursements proxy: Pas de token Authorization');
    return NextResponse.json({ 
      success: false, 
      error: 'Token d\'authentification requis',
      message: 'Unauthorized'
    }, { status: 401 });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken,
      },
    });

    const data = await response.json();
    
    // ✅ Log des erreurs 401 pour debug
    if (response.status === 401) {
      console.error('❌ partner-reimbursements Edge Function returned 401:', {
        url,
        hasToken: !!accessToken,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none',
        responseData: data
      });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in partner-reimbursements proxy:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathSegments = request.url.split('/');
  const id = pathSegments[pathSegments.length - 1];
  
  const url = `${PARTNER_REIMBURSEMENTS_BASE_URL}/${id}`;
  const accessToken = request.headers.get('Authorization');
  const body = await request.json();

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in partner-reimbursements PUT proxy:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
