import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '../../../lib/pesepay';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceNumber = searchParams.get('referenceNumber') || searchParams.get('reference');

    if (!referenceNumber) {
      return NextResponse.json(
        { error: 'Reference number is required' },
        { status: 400 }
      );
    }

    const result = await checkPaymentStatus(referenceNumber);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('PesePay status error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check payment status'
      },
      { status: 500 }
    );
  }
}
