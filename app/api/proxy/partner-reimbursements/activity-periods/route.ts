import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PARTNER_REIMBURSEMENTS_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-reimbursements`;

export async function GET(request: Request) {
  const url = `${PARTNER_REIMBURSEMENTS_BASE_URL}/activity-periods`;
  const accessToken = request.headers.get('Authorization');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in partner-reimbursements/activity-periods proxy:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
