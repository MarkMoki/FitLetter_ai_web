import { NextRequest, NextResponse } from 'next/server';
import { invalidateSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await invalidateSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}