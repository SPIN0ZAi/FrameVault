import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, forbiddenError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/lists/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        const userId = session?.user?.id;

        const [list, likeCount, userLike] = await Promise.all([
            prisma.list.findUnique({
                where: { id },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    movies: { orderBy: { position: 'asc' } },
                    clonedFrom: { select: { id: true, title: true, user: { select: { username: true } } } },
                },
            }),
            prisma.listLike.count({ where: { listId: id } }),
            userId ? prisma.listLike.findUnique({ where: { userId_listId: { userId, listId: id } } }) : null,
        ]);

        if (!list) return notFoundError('List');
        if (!list.isPublic && list.userId !== userId) return forbiddenError();

        // Compute watched count for viewer
        let watchedCount = 0;
        if (userId && list.movies.length > 0) {
            const tmdbMovieIds = list.movies.filter(m => m.mediaType === 'movie').map(m => m.tmdbId);
            const tmdbShowIds  = list.movies.filter(m => m.mediaType === 'show').map(m => m.tmdbId);

            const [watchedMovies, watchedShows] = await Promise.all([
                tmdbMovieIds.length > 0
                    ? prisma.watchedMovie.findMany({
                        where: { userId, movie: { tmdbId: { in: tmdbMovieIds } } },
                        include: { movie: { select: { tmdbId: true } } },
                    })
                    : [],
                tmdbShowIds.length > 0
                    ? prisma.watchedShow.findMany({
                        where: { userId, tmdbShowId: { in: tmdbShowIds } },
                        select: { tmdbShowId: true },
                    })
                    : [],
            ]);

            const watchedMovieTmdbIds = new Set(watchedMovies.map(w => w.movie.tmdbId));
            const watchedShowTmdbIds  = new Set(watchedShows.map(w => w.tmdbShowId));

            watchedCount = list.movies.filter(m =>
                m.mediaType === 'movie'
                    ? watchedMovieTmdbIds.has(m.tmdbId)
                    : watchedShowTmdbIds.has(m.tmdbId)
            ).length;
        }

        return successResponse({
            ...list,
            likeCount,
            likedByMe: !!userLike,
            watchedCount,
        });
    } catch (error) {
        console.error('GET /api/lists/[id] error:', error);
        return serverError();
    }
}

// PATCH /api/lists/[id] — update title / description / visibility / bannerUrl
export async function PATCH(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        const { title, description, isPublic, bannerUrl, isFeatured, isOfficial } = await req.json();
        const isAdmin = session.user.role === 'admin';

        const updated = await prisma.list.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim().slice(0, 200) }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(isPublic !== undefined && { isPublic }),
                ...(bannerUrl !== undefined && { bannerUrl: bannerUrl || null }),
                ...(isAdmin && isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
                ...(isAdmin && isOfficial !== undefined && { isOfficial: Boolean(isOfficial) }),
            },
        });

        return successResponse(updated);
    } catch (error) {
        console.error('PATCH /api/lists/[id] error:', error);
        return serverError();
    }
}

// DELETE /api/lists/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        await prisma.list.delete({ where: { id } });
        return successResponse({ deleted: true });
    } catch (error) {
        console.error('DELETE /api/lists/[id] error:', error);
        return serverError();
    }
}
