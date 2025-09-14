import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import crypto from 'crypto';

function epochSecs(date: Date = new Date()) { return Math.floor(date.getTime() / 1000); }

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const normalized = email.toLowerCase().trim();

    // Find user by email
    const { data: user, error: userErr } = await db
      .from('users')
      .select('id,email')
      .eq('email', normalized)
      .maybeSingle();

    // Always return success to avoid email enumeration
    if (userErr) {
      return NextResponse.json({ success: true });
    }

    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Create password reset token valid for 30 minutes
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = epochSecs(new Date(Date.now() + 30 * 60 * 1000));

    const { error: insertErr } = await db
      .from('password_resets')
      .insert({ token, user_id: user.id, expires_at: expiresAt })
      .select()
      .single();

    if (insertErr) {
      // Still do not reveal
      return NextResponse.json({ success: true });
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/reset-password?token=${token}`;

    // TODO: Integrate real email provider. For now, log to server console.
    console.log(`[Password Reset] Send to ${user.email}: ${resetUrl}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: true });
  }
}
