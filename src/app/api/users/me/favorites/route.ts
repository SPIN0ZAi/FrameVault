import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError, validationError } from '@/lib/api-response';
import { z } from 'zod';

const favoriteItemSchema = z.object({
    tmdbId: z.number().int().positive(),
    title: z.string().min(1).max(500).trim(),
    year: z.number().int().min(1888).max(2100).optional().nullable(),
    posterUrl: z.string().url().max(2048).optional().nullable(),
    position: z.number().int().min(0).max(4),
});
const favoritesSchema = z.array(favoriteItemSchema).max(5);

// GET /api/users/me/favorites
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const favorites = await prisma.userFavorite.findMany({
            where: { userId: session.user.id },
            orderBy: { position: 'asc' },
        });
        return successResponse(favorites);
    } catch {
        return serverError();
    }
}

// PUT /api/users/me/favorites — replace the full ordered list
// Body: [{ tmdbId, title, year, posterUrl, position }]
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const raw = await req.json();
        const parsed = favoritesSchema.safeParse(raw);
        if (!parsed.success) {
            return validationError(parsed.error.issues[0]?.message ?? 'Invalid favorites payload');
        }
        const items = parsed.data;

        // Validate: max 5 items, positions 0–4
        if (!Array.isArray(items) || items.length > 5) {
            return serverError('Must supply between 0 and 5 favorites');
        }

        // Delete existing favorites and recreate in a transaction
        await prisma.$transaction(async (tx) => {
            await tx.userFavorite.deleteMany({ where: { userId: session.user.id } });
            if (items.length > 0) {
                await tx.userFavorite.createMany({
                    data: items.map((item, idx) => ({
                        userId: session.user.id,
                        tmdbId: item.tmdbId,
                        title: item.title,
                        year: item.year ?? null,
                        posterUrl: item.posterUrl ?? null,
                        position: item.position ?? idx,
                    })),
                });
            }
        });

        const result = await prisma.userFavorite.findMany({
            where: { userId: session.user.id },
            orderBy: { position: 'asc' },
        });
        return successResponse(result);
    } catch (e) {
        console.error('PUT favorites error', e);
        return serverError();
    }
}
