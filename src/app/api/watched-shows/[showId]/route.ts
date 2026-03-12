import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, notFoundError, serverError } from '@/lib/api-response';

// POST /api/watched-shows/[showId]
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

        const body = await request.json().catch(() => ({}));
        const { title = 'Unknown Show', year = null, posterUrl = null } = body as {
            title?: string; year?: number | null; posterUrl?: string | null;
        };

        const existing = await prisma.watchedShow.findUnique({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
            select: { rewatchCount: true, lastRewatchedAt: true },
        });

        const watched = await prisma.watchedShow.upsert({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
            create: {
                userId: session.user.id,
                tmdbShowId,
                title,
                year,
                posterUrl,
                rewatchCount: 0,
                lastRewatchedAt: null,
            },
            update: { watchedAt: new Date(), title, year, posterUrl },
        });

        // Remove from show watchlist when marking as watched
        await prisma.showWatchlistItem.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({
            ...watched,
            rewatchCount: existing?.rewatchCount ?? watched.rewatchCount,
            lastRewatchedAt: (existing?.lastRewatchedAt ?? watched.lastRewatchedAt)?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('POST watched-shows error:', error);
        return serverError();
    }
}

// DELETE /api/watched-shows/[showId]
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

        await prisma.watchedShow.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE watched-shows error:', error);
        return serverError();
    }
}

// GET /api/watched-shows/[showId] — check if watched by current user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return successResponse({ watched: false });

        const { showId } = await params;
        const tmdbShowId = parseInt(showId);
        if (isNaN(tmdbShowId)) return successResponse({ watched: false });

        const record = await prisma.watchedShow.findUnique({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
        });

        return successResponse({
            watched: !!record,
            rewatchCount: record?.rewatchCount ?? 0,
            lastRewatchedAt: record?.lastRewatchedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('GET watched-shows error:', error);
        return serverError();
    }
}
