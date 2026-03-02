import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/watched — user's watched movies
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) return notFoundError('User');

        const [watched, totalCount] = await Promise.all([
            prisma.watchedMovie.findMany({
                where: { userId: user.id },
                include: {
                    movie: {
                        select: {
                            id: true,
                            tmdbId: true,
                            title: true,
                            year: true,
                            posterUrl: true,
                            customPosters: {
                                where: { userId: user.id },
                                select: { posterUrl: true }
                            }
                        }
                    },
                },
                orderBy: { watchedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchedMovie.count({ where: { userId: user.id } }),
        ]);

        return successResponse(watched, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user watched error:', error);
        return serverError();
    }
}
