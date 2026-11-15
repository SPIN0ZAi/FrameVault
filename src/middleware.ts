import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Cached Redis client and limiters
let redisClient: Redis | null = null;
let loginLimiter: Ratelimit | null = null;
let registerLimiter: Ratelimit | null = null;
let passwordLimiter: Ratelimit | null = null;
let presignLimiter: Ratelimit | null = null;
let forgotPasswordLimiter: Ratelimit | null = null;
let resetPasswordLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
    if (redisClient) return redisClient;

    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    // Fail open if environment variables are not set or invalid
    if (!url || !token || !url.startsWith('http')) {
        return null;
    }

    try {
        redisClient = new Redis({
            url,
            token,
            // Disable retries in middleware to avoid blocking requests for 4+ seconds
            retry: false,
        });
        return redisClient;
    } catch (e) {
        console.warn('[RateLimit] Failed to instantiate Redis client:', e);
        return null;
    }
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
    try {
        return new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(requests, window),
            prefix,
            analytics: false,
        });
    } catch (e) {
        console.warn(`[RateLimit] Failed to create limiter for ${prefix}:`, e);
        return null;
    }
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

async function checkRateLimit(limiter: Ratelimit | null, key: string): Promise<boolean> {
    if (!limiter) return true; // Fail open if rate limiting is not configured
    try {
        const { success } = await limiter.limit(key);
        return success;
    } catch (error) {
        // Fail open: log the warning and let the request proceed so Redis outages or quota limits
        // don't bring down middleware or return 500 MIDDLEWARE_INVOCATION_FAILED.
        console.warn('[RateLimit] Redis error encountered, failing open:', error);
        return true;
    }
}

export async function middleware(req: NextRequest) {
    try {
        const { pathname } = req.nextUrl;
        const ip = getIp(req);

        // ── Login ────────────────────────────────────────────────────
        if (pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
            loginLimiter = getLimiter(loginLimiter, 10, '15 m', 'rl:login');
            const allowed = await checkRateLimit(loginLimiter, ip);
            if (!allowed) return rateLimitedResponse();
        }

        // ── Register ─────────────────────────────────────────────────
        if (pathname === '/api/auth/register' && req.method === 'POST') {
            registerLimiter = getLimiter(registerLimiter, 5, '1 h', 'rl:register');
            const allowed = await checkRateLimit(registerLimiter, ip);
            if (!allowed) return rateLimitedResponse();
        }

        // ── Change Password ──────────────────────────────────────────
        if (pathname === '/api/auth/change-password' && req.method === 'POST') {
            passwordLimiter = getLimiter(passwordLimiter, 5, '15 m', 'rl:password');
            const allowed = await checkRateLimit(passwordLimiter, ip);
            if (!allowed) return rateLimitedResponse();
        }

        // ── Upload presign (prevent signed-URL farming) ──────────────────
        if (pathname === '/api/uploads/presign' && req.method === 'POST') {
            presignLimiter = getLimiter(presignLimiter, 20, '10 m', 'rl:presign');
            const allowed = await checkRateLimit(presignLimiter, ip);
            if (!allowed) return rateLimitedResponse();
        }

        // ── Forgot Password (prevent email enumeration / spam) ───────────
        if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
            forgotPasswordLimiter = getLimiter(forgotPasswordLimiter, 5, '1 h', 'rl:forgot-password');
            const allowed = await checkRateLimit(forgotPasswordLimiter, ip);
            if (!allowed) return rateLimitedResponse();
        }

        // ── Reset Password ───────────────────────────────────────────────
        if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
            resetPasswordLimiter = getLimiter(resetPasswordLimiter, 5, '15 m', 'rl:reset-password');
            const allowed = await checkRateLimit(resetPasswordLimiter, ip);
            if (!allowed) return rateLimitedResponse();
        }

        return NextResponse.next();
    } catch (error) {
        // Global fail-open safety net: never return 500 from middleware on unhandled exceptions
        console.error('[Middleware] Unhandled error, passing request through:', error);
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/api/auth/callback/credentials',
        '/api/auth/register',
        '/api/auth/change-password',
        '/api/uploads/presign',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
    ],
};
