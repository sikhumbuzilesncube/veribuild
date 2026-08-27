import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📄 TEST API CALLED!');
    console.log('📄 Received body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test API worked!',
      received: body
    });
  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
