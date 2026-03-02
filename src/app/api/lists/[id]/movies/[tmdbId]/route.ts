import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, forbiddenError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string; tmdbId: string }> };

// DELETE /api/lists/[id]/movies/[tmdbId] — remove a movie from the list
export async function DELETE(_req: NextRequest, { params }: Ctx) {
    try {
        const { id, tmdbId } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        await prisma.listMovie.delete({
            where: { listId_tmdbId: { listId: id, tmdbId: Number(tmdbId) } },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error('DELETE /api/lists/[id]/movies/[tmdbId] error:', error);
        return serverError();
    }
}
