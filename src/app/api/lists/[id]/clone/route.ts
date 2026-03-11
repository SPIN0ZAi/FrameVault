import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/lists/[id]/clone
export async function POST(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const original = await prisma.list.findUnique({
            where: { id },
            include: { movies: { orderBy: { position: 'asc' } } },
        });
        if (!original) return notFoundError('List');
        if (!original.isPublic && original.userId !== session.user.id) {
            return successResponse({ error: 'Cannot clone a private list' }, 403);
        }

        // Create the cloned list
        const cloned = await prisma.list.create({
            data: {
                id: `lst_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                userId: session.user.id,
                title: `${original.title} (copy)`,
                description: original.description,
                bannerUrl: original.bannerUrl,
                isPublic: false,
                clonedFromId: original.id,
            },
        });

        // Clone all items
        if (original.movies.length > 0) {
            await prisma.listMovie.createMany({
                data: original.movies.map((m) => ({
                    id: `lm_${Date.now()}_${Math.random().toString(36).slice(2)}_${m.position}`,
                    listId: cloned.id,
                    tmdbId: m.tmdbId,
                    title: m.title,
                    year: m.year,
                    posterUrl: m.posterUrl,
                    position: m.position,
                    note: m.note,
                    groupLabel: m.groupLabel,
                    mediaType: m.mediaType,
                })),
            });
        }

        return successResponse({ id: cloned.id, title: cloned.title });
    } catch (error) {
        console.error('POST /api/lists/[id]/clone error:', error);
        return serverError();
    }
}
