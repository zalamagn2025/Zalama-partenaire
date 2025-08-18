// FONCTIONNALITÉ OTP TEMPORAIREMENT DÉSACTIVÉE
// Cette fonctionnalité a été mise de côté pour le moment

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Fonctionnalité OTP temporairement désactivée",
      message: "Cette fonctionnalité a été mise de côté pour le moment",
    },
    { status: 503 }
  );
}
