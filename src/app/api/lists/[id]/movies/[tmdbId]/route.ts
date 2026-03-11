import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, forbiddenError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string; tmdbId: string }> };

// DELETE /api/lists/[id]/movies/[tmdbId] — remove a movie or show from the list
export async function DELETE(req: NextRequest, { params }: Ctx) {
    try {
        const { id, tmdbId } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        const { searchParams } = new URL(req.url);
        const mediaType = searchParams.get('mediaType') === 'show' ? 'show' : 'movie';

        await prisma.listMovie.delete({
            where: { listId_tmdbId_mediaType: { listId: id, tmdbId: Number(tmdbId), mediaType } },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error('DELETE /api/lists/[id]/movies/[tmdbId] error:', error);
        return serverError();
    }
}
