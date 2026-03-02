import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, forbiddenError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/lists/[id]/movies — add a movie to the list
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        const { tmdbId, title, year, posterUrl, note } = await req.json();
        if (!tmdbId || !title) return serverError('tmdbId and title are required');

        // Count existing movies to set position
        const count = await prisma.listMovie.count({ where: { listId: id } });

        const movie = await prisma.listMovie.upsert({
            where: { listId_tmdbId: { listId: id, tmdbId: Number(tmdbId) } },
            update: { note: note || null },
            create: {
                listId: id,
                tmdbId: Number(tmdbId),
                title,
                year: year || null,
                posterUrl: posterUrl || null,
                note: note || null,
                position: count,
            },
        });

        // Bump list updatedAt
        await prisma.list.update({ where: { id }, data: { updatedAt: new Date() } });

        return successResponse(movie);
    } catch (error) {
        console.error('POST /api/lists/[id]/movies error:', error);
        return serverError();
    }
}
