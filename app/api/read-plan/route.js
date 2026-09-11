import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Direct plan reading via API is not supported. Use the readPlan server action or enter data manually.',
      fallback: true,
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint has been retired. Plan reading is handled by the server action at app/actions/readPlan.js.',
    },
    { status: 410 }
  );
}
