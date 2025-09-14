import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: number;
  expiresAt: Date;
}

// Session configuration
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_COOKIE_NAME = 'fitletter_session';

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Generate secure session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create session (stored in Supabase sessions table)
export async function createSession(userId: number): Promise<string> {
  const token = generateSessionToken();
  const expiresAtMs = Date.now() + SESSION_DURATION;
  const expiresAtSec = Math.floor(expiresAtMs / 1000);

  const { error } = await db
    .from('sessions')
    .insert({ id: token, user_id: userId, expires_at: expiresAtSec })
    .select()
    .single();

  if (error) {
    throw new AuthError(`Failed to create session: ${error.message}`, 'SESSION_CREATE_FAILED');
  }

  // Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(expiresAtMs),
    path: '/',
  });

  return token;
}

// Get current session
export async function getCurrentSession(): Promise<{ user: User; session: Session } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);

  // Get session
  const { data: sessionRow, error: sessionError } = await db
    .from('sessions')
    .select('*')
    .eq('id', token)
    .gt('expires_at', nowSec)
    .maybeSingle();

  if (sessionError) {
    // On query errors, invalidate cookie silently
    await invalidateSession();
    return null;
  }

  if (!sessionRow) {
    await invalidateSession();
    return null;
  }

  // Get user data
  const { data: userRow, error: userError } = await db
    .from('users')
    .select('*')
    .eq('id', sessionRow.user_id)
    .maybeSingle();

  if (userError || !userRow) {
    await invalidateSession();
    return null;
  }

  return {
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name ?? null,
      createdAt: userRow.created_at ? new Date((userRow.created_at as number) * 1000) : new Date(),
    },
    session: {
      id: sessionRow.id,
      userId: sessionRow.user_id,
      expiresAt: new Date((sessionRow.expires_at as number) * 1000),
    },
  };
}

// Require authentication (for server components)
export async function requireAuth(): Promise<{ user: User; session: Session }> {
  const auth = await getCurrentSession();
  
  if (!auth) {
    redirect('/login');
  }

  return auth;
}

// Invalidate session
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.from('sessions').delete().eq('id', token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Clean up expired sessions (should be run periodically)
export async function cleanupExpiredSessions(): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);
  await db.from('sessions').delete().lt('expires_at', nowSec);
}

// Sign up user
export async function signUp(email: string, password: string, name: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();

  // Check if user already exists
  const { data: existingUser, error: existingErr } = await db
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingErr) {
    throw new AuthError(`Failed to check existing user: ${existingErr.message}`, 'DB_ERROR');
  }

  if (existingUser) {
    throw new AuthError('User already exists with this email', 'USER_EXISTS');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const createdAtSec = Math.floor(Date.now() / 1000);

  const { data: insertedUser, error: insertErr } = await db
    .from('users')
    .insert({ email: normalizedEmail, name: trimmedName, password_hash: passwordHash, created_at: createdAtSec })
    .select('*')
    .single();

  if (insertErr) {
    throw new AuthError(`Failed to create user: ${insertErr.message}`, 'USER_CREATE_FAILED');
  }

  return {
    id: insertedUser.id,
    email: insertedUser.email,
    name: insertedUser.name ?? null,
    createdAt: insertedUser.created_at ? new Date((insertedUser.created_at as number) * 1000) : new Date(),
  };
}

// Sign in user
export async function signIn(email: string, password: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();

  const { data: userRow, error } = await db
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new AuthError(`Failed to fetch user: ${error.message}`, 'DB_ERROR');
  }

  if (!userRow || !userRow.password_hash) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await verifyPassword(password, userRow.password_hash);
  
  if (!isValidPassword) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name ?? null,
    createdAt: userRow.created_at ? new Date((userRow.created_at as number) * 1000) : new Date(),
  };
}
