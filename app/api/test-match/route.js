import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📊 Test API called with:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test API is working!',
      received: body
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
