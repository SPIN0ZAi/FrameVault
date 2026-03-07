import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, notFoundError, serverError, validationError } from '@/lib/api-response';
import { z } from 'zod';

const showWatchlistBodySchema = z.object({
    title: z.string().min(1).max(500).trim().default('Unknown Show'),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    posterUrl: z.string().url().max(2048).optional().nullable(),
});

// POST /api/show-watchlist/[showId]
// Body: { title, year?, posterUrl? }
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { showId } = await params;
        const tmdbShowId = parseInt(showId);
        if (isNaN(tmdbShowId)) return notFoundError('Show');

        const rawBody = await request.json().catch(() => ({}));
        const bodyParsed = showWatchlistBodySchema.safeParse(rawBody);
        if (!bodyParsed.success) return validationError(bodyParsed.error.issues[0]?.message ?? 'Invalid body');
        const { title, year, posterUrl } = bodyParsed.data;

        const item = await prisma.showWatchlistItem.upsert({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
            create: { userId: session.user.id, tmdbShowId, title, year, posterUrl },
            update: {},
        });

        return successResponse(item);
    } catch (error) {
        console.error('POST show-watchlist error:', error);
        return serverError();
    }
}

// DELETE /api/show-watchlist/[showId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { showId } = await params;
        const tmdbShowId = parseInt(showId);
        if (isNaN(tmdbShowId)) return notFoundError('Show');

        await prisma.showWatchlistItem.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE show-watchlist error:', error);
        return serverError();
    }
}

// GET /api/show-watchlist/[showId] — check if in watchlist
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return successResponse({ inWatchlist: false });

        const { showId } = await params;
        const tmdbShowId = parseInt(showId);
        if (isNaN(tmdbShowId)) return successResponse({ inWatchlist: false });

        const record = await prisma.showWatchlistItem.findUnique({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
        });

        return successResponse({ inWatchlist: !!record });
    } catch (error) {
        console.error('GET show-watchlist error:', error);
        return serverError();
    }
}
