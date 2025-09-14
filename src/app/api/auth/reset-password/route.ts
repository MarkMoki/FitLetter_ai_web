import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hashPassword } from '@/lib/auth';

function epochSecs() { return Math.floor(Date.now() / 1000); }

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const now = epochSecs();

    // Find valid reset token
    const { data: reset, error: resetErr } = await db
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', now)
      .maybeSingle();

    if (resetErr || !reset) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Update user password
    const newHash = await hashPassword(password);
    const { error: updUserErr } = await db
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', reset.user_id);

    if (updUserErr) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // Mark token used
    const { error: updTokErr } = await db
      .from('password_resets')
      .update({ used_at: now })
      .eq('token', token);

    if (updTokErr) {
      // Non-fatal
      console.warn('Failed to mark password reset token used:', updTokErr);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
