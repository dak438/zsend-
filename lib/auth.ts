import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-ascend-secret-should-be-overridden-in-production';
const COOKIE_NAME = 'ascend_session';

export interface SessionPayload {
  userId: string;
  email: string;
}

/**
 * Hash password with bcrypt cost factor 12 per SECURITY.md §2
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare plain password against stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT session token with 30-day expiry
 */
export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify JWT session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set HTTP-only secure cookie for authentication
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clear authentication session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

import { getServerSession } from 'next-auth';
import { authOptions } from './nextauth';

/**
 * Retrieve current authenticated user from NextAuth session or fallback cookie
 */
export async function getSessionUser() {
  // 1. Check NextAuth server session first
  try {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: nextAuthSession.user.email.toLowerCase().trim() },
        include: { character: true },
      });
      if (user) return user;
    }
  } catch {}

  // 2. Fallback to JWT session cookie (for Vitest test suites and direct tokens)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { character: true },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * RATE LIMITING CAVEAT (SECURITY.md §2 & ARCHITECTURE.md §1.1):
 * In-memory rate limiting is strictly a v1-only stopgap. It will not function
 * reliably across multiple serverless instances on Vercel and must be upgraded
 * to a persistent distributed store (e.g. Redis / Upstash) before or shortly
 * after public launch.
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, resetAt: record.resetAt };
}
