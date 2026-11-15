import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Returns a Ratelimit instance only if Upstash env vars are configured.
 * When not configured (local dev without Redis), returns null and all
 * rate-limit checks will be skipped (fail-open).
 */
function createLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`, prefix: string) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token || !url.startsWith('http')) return null;

    try {
        return new Ratelimit({
            redis: new Redis({ url, token, retry: false }),
            limiter: Ratelimit.slidingWindow(requests, window),
            prefix,
            analytics: false,
        });
    } catch {
        return null;
    }
}

// 10 login attempts per 15 minutes per IP
export const loginLimiter = createLimiter(10, '15 m', 'rl:login');

// 5 registrations per hour per IP
export const registerLimiter = createLimiter(5, '1 h', 'rl:register');

// 5 password-change attempts per 15 minutes per IP
export const passwordLimiter = createLimiter(5, '15 m', 'rl:password');
