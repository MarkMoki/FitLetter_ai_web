import { NextRequest, NextResponse } from 'next/server';
import { signUp, createSession, AuthError } from '@/lib/auth';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const { email, password, name } = signUpSchema.parse(body);

    // Create user
    const user = await signUp(email, password, name);

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
    console.error('Sign up error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'USER_EXISTS' ? 409 : 400 }
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