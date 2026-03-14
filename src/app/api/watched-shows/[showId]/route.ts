import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
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

        const existing = await prisma.watchedShow.findFirst({
            where: { userId: session.user.id, tmdbShowId },
            select: { id: true },
        }).catch(() => null);

        let watched: Record<string, unknown>;
        try {
            if (existing?.id) {
                watched = await prisma.watchedShow.update({
                    where: { id: existing.id },
                    data: { watchedAt: new Date(), title, year, posterUrl },
                });
            } else {
                try {
                    watched = await prisma.watchedShow.create({
                        data: {
                            userId: session.user.id,
                            tmdbShowId,
                            title,
                            year,
                            posterUrl,
                            rewatchCount: 0,
                            lastRewatchedAt: null,
                        },
                    });
                } catch {
                    watched = await prisma.watchedShow.create({
                        data: {
                            userId: session.user.id,
                            tmdbShowId,
                            title,
                            year,
                            posterUrl,
                        },
                    });
                }
            }
        } catch {
            // Raw SQL fallback for production schema drift
            const updated = await prisma.$executeRaw`
                UPDATE watched_shows
                SET "watchedAt" = NOW(), "title" = ${title}, "year" = ${year}, "posterUrl" = ${posterUrl}
                WHERE "userId" = ${session.user.id} AND "tmdbShowId" = ${tmdbShowId}
            `;

            if (!updated) {
                await prisma.$executeRaw`
                    INSERT INTO watched_shows ("id", "userId", "tmdbShowId", "title", "year", "posterUrl", "watchedAt")
                    VALUES (${randomUUID()}, ${session.user.id}, ${tmdbShowId}, ${title}, ${year}, ${posterUrl}, NOW())
                `;
            }

            const fallbackRow = await prisma.$queryRaw<{ id: string; watchedAt: Date }[]>`
                SELECT "id", "watchedAt"
                FROM watched_shows
                WHERE "userId" = ${session.user.id} AND "tmdbShowId" = ${tmdbShowId}
                LIMIT 1
            `;
            watched = fallbackRow[0] ?? { id: randomUUID(), watchedAt: new Date() };
        }

        const rewatchMeta = await prisma.watchedShow.findFirst({
            where: { userId: session.user.id, tmdbShowId },
            select: { rewatchCount: true, lastRewatchedAt: true },
        }).catch(() => ({ rewatchCount: 0, lastRewatchedAt: null }));

        // Remove from show watchlist when marking as watched
        await prisma.showWatchlistItem.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({
            ...watched,
            watched: true,
            rewatchCount: rewatchMeta?.rewatchCount ?? 0,
            lastRewatchedAt: rewatchMeta?.lastRewatchedAt?.toISOString() ?? null,
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

        const record = await prisma.watchedShow.findFirst({
            where: { userId: session.user.id, tmdbShowId },
            select: { id: true },
        });

        const rewatchMeta = await prisma.watchedShow.findFirst({
            where: { userId: session.user.id, tmdbShowId },
            select: { rewatchCount: true, lastRewatchedAt: true },
        }).catch(() => ({ rewatchCount: 0, lastRewatchedAt: null }));

        return successResponse({
            watched: !!record,
            rewatchCount: rewatchMeta?.rewatchCount ?? 0,
            lastRewatchedAt: rewatchMeta?.lastRewatchedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('GET watched-shows error:', error);
        return serverError();
    }
}
