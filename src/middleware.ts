import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy-create limiters only when env vars are present (fail-open otherwise)
let loginLimiter: Ratelimit | null = null;
let registerLimiter: Ratelimit | null = null;
let passwordLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return new Redis({ url, token });
}

function getLimiter(
    ref: Ratelimit | null,
    requests: number,
    window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
    prefix: string
): Ratelimit | null {
    if (ref) return ref;
    const redis = getRedis();
    if (!redis) return null;
    return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), prefix, analytics: false });
}

function getIp(req: NextRequest): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        req.headers.get('x-real-ip') ??
        'unknown'
    );
}

function rateLimitedResponse(): NextResponse {
    return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429, headers: { 'Retry-After': '60' } }
    );
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const ip = getIp(req);

    // ── Login ────────────────────────────────────────────────────
    if (pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
        loginLimiter = getLimiter(loginLimiter, 10, '15 m', 'rl:login');
        if (loginLimiter) {
            const { success } = await loginLimiter.limit(ip);
            if (!success) return rateLimitedResponse();
        }
    }

    // ── Register ─────────────────────────────────────────────────
    if (pathname === '/api/auth/register' && req.method === 'POST') {
        registerLimiter = getLimiter(registerLimiter, 5, '1 h', 'rl:register');
        if (registerLimiter) {
            const { success } = await registerLimiter.limit(ip);
            if (!success) return rateLimitedResponse();
        }
    }

    // ── Change Password ──────────────────────────────────────────
    if (pathname === '/api/auth/change-password' && req.method === 'POST') {
        passwordLimiter = getLimiter(passwordLimiter, 5, '15 m', 'rl:password');
        if (passwordLimiter) {
            const { success } = await passwordLimiter.limit(ip);
            if (!success) return rateLimitedResponse();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/auth/callback/credentials',
        '/api/auth/register',
        '/api/auth/change-password',
    ],
};
