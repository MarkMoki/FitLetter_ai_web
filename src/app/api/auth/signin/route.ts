import { NextRequest, NextResponse } from 'next/server';
import { signIn, createSession, AuthError } from '@/lib/auth';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const { email, password } = signInSchema.parse(body);

    // Authenticate user
    const user = await signIn(email, password);

    // Create session
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}