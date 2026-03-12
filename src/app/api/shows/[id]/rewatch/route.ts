import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, serverError } from '@/lib/api-response';

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return errorResponse({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }

        const { id: tmdbShowIdStr } = await params;
        const tmdbShowId = parseInt(tmdbShowIdStr);
        if (isNaN(tmdbShowId)) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'Invalid show id' }, 400);
        }

        const userId = session.user.id;
        const existing = await prisma.watchedShow.findUnique({
            where: { userId_tmdbShowId: { userId, tmdbShowId } },
            select: { title: true, year: true, posterUrl: true },
        });

        const now = new Date();
        const watched = await prisma.watchedShow.upsert({
            where: { userId_tmdbShowId: { userId, tmdbShowId } },
            create: {
                userId,
                tmdbShowId,
                title: existing?.title ?? 'Unknown Show',
                year: existing?.year ?? null,
                posterUrl: existing?.posterUrl ?? null,
                watchedAt: now,
                rewatchCount: 1,
                lastRewatchedAt: now,
            },
            update: {
                watchedAt: now,
                rewatchCount: { increment: 1 },
                lastRewatchedAt: now,
            },
            select: { rewatchCount: true, lastRewatchedAt: true },
        });

        await prisma.showWatchlistItem.deleteMany({
            where: { userId, tmdbShowId },
        });

        return successResponse({
            rewatchCount: watched.rewatchCount,
            lastRewatchedAt: watched.lastRewatchedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('POST /api/shows/[id]/rewatch error:', error);
        return serverError();
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return errorResponse({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }

        const { id: tmdbShowIdStr } = await params;
        const tmdbShowId = parseInt(tmdbShowIdStr);
        if (isNaN(tmdbShowId)) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'Invalid show id' }, 400);
        }

        const userId = session.user.id;
        const existing = await prisma.watchedShow.findUnique({
            where: { userId_tmdbShowId: { userId, tmdbShowId } },
            select: { rewatchCount: true },
        });

        if (!existing || existing.rewatchCount <= 0) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'No rewatch to undo' }, 400);
        }

        const newCount = existing.rewatchCount - 1;
        const updated = await prisma.watchedShow.update({
            where: { userId_tmdbShowId: { userId, tmdbShowId } },
            data: {
                rewatchCount: newCount,
                lastRewatchedAt: newCount === 0 ? null : undefined,
            },
            select: { rewatchCount: true, lastRewatchedAt: true },
        });

        return successResponse({
            rewatchCount: updated.rewatchCount,
            lastRewatchedAt: updated.lastRewatchedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('DELETE /api/shows/[id]/rewatch error:', error);
        return serverError();
    }
}