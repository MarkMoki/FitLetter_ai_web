import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
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

// Create session
export async function createSession(userId: number): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  // Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
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

  // Get session with user data
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    // Clean up expired session cookie
    await invalidateSession();
    return null;
  }

  const { session, user } = result[0];

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt || new Date(),
    },
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt || new Date(),
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
    // Remove from database
    await db.delete(sessions).where(eq(sessions.id, token));
  }

  // Clear cookie
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Clean up expired sessions (should be run periodically)
export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(
    and(
      sessions.expiresAt,
      sessions.expiresAt < new Date()
    )
  );
}

// Sign up user
export async function signUp(email: string, password: string, name: string): Promise<User> {
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  if (existingUser) {
    throw new AuthError('User already exists with this email', 'USER_EXISTS');
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  
  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash: hashedPassword,
  }).returning();

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: newUser.createdAt || new Date(),
  };
}

// Sign in user
export async function signIn(email: string, password: string): Promise<User> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  if (!user || !user.passwordHash) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  
  if (!isValidPassword) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt || new Date(),
  };
}