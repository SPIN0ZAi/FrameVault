import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/users/[username]/favorites — public
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return successResponse([]);

        const favorites = await prisma.userFavorite.findMany({
            where: { userId: user.id },
            orderBy: { position: 'asc' },
        });

        // Overlay custom posters: look up Movie by tmdbId and check if user has a custom poster
        const tmdbIds = favorites.map(f => f.tmdbId);
        const movies = await prisma.movie.findMany({
            where: { tmdbId: { in: tmdbIds } },
            select: {
                tmdbId: true,
                customPosters: {
                    where: { userId: user.id },
                    select: { posterUrl: true },
                },
            },
        });
        const customPosterMap = new Map(
            movies
                .filter(m => m.customPosters.length > 0)
                .map(m => [m.tmdbId!, m.customPosters[0].posterUrl])
        );

        const data = favorites.map(f => ({
            ...f,
            posterUrl: customPosterMap.get(f.tmdbId) ?? f.posterUrl,
        }));

        return successResponse(data);
    } catch {
        return serverError();
    }
}
