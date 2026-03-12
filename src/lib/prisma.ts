import { cache } from 'react';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Create a new PrismaClient per request (required for Cloudflare Workers).
// React's cache() memoizes within a single request, so each route handler
// gets exactly one client — no cross-request connection sharing.
const createClient = cache(() => {
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL ?? '',
        maxUses: 1, // discard connection after each use — safe in Workers
    });
    return new PrismaClient({ adapter });
});

// Proxy keeps the exported name `prisma` unchanged across all 60+ import sites.
export const prisma = new Proxy({} as PrismaClient, {
    get(_, prop: string | symbol) {
        return (createClient() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
