import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError, validationError } from '@/lib/api-response';
import { z } from 'zod';

const showFavoriteItemSchema = z.object({
    tmdbShowId: z.number().int().positive(),
    title: z.string().min(1).max(500).trim(),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    posterUrl: z.string().url().max(2048).optional().nullable(),
    position: z.number().int().min(0).max(4),
});
const showFavoritesSchema = z.array(showFavoriteItemSchema).max(5);

// GET /api/users/me/show-favorites
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const favorites = await prisma.userShowFavorite.findMany({
            where: { userId: session.user.id },
            orderBy: { position: 'asc' },
        });
        return successResponse(favorites);
    } catch {
        return serverError();
    }
}

// PUT /api/users/me/show-favorites — replace the full ordered list
// Body: [{ tmdbShowId, title, year?, posterUrl?, position }]
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const raw = await req.json();
        const parsed = showFavoritesSchema.safeParse(raw);
        if (!parsed.success) {
            return validationError(parsed.error.issues[0]?.message ?? 'Invalid favorites payload');
        }
        const items = parsed.data;

        if (!Array.isArray(items) || items.length > 5) {
            return serverError('Must supply between 0 and 5 favorites');
        }

        await prisma.$transaction(async (tx) => {
            await tx.userShowFavorite.deleteMany({ where: { userId: session.user.id } });
            if (items.length > 0) {
                await tx.userShowFavorite.createMany({
                    data: items.map((item, idx) => ({
                        userId: session.user.id,
                        tmdbShowId: item.tmdbShowId,
                        title: item.title,
                        year: item.year ?? null,
                        posterUrl: item.posterUrl ?? null,
                        position: item.position ?? idx,
                    })),
                });
            }
        });

        const updated = await prisma.userShowFavorite.findMany({
            where: { userId: session.user.id },
            orderBy: { position: 'asc' },
        });

        return successResponse(updated);
    } catch {
        return serverError();
    }
}
