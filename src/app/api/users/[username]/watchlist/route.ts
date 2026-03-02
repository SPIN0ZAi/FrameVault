import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, parseInt(searchParams.get('limit') || '40'));

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        const [items, totalCount] = await Promise.all([
            prisma.watchlistItem.findMany({
                where: { userId: user.id },
                include: {
                    movie: {
                        select: {
                            id: true,
                            tmdbId: true,
                            title: true,
                            year: true,
                            posterUrl: true,
                        },
                    },
                },
                orderBy: { addedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchlistItem.count({ where: { userId: user.id } }),
        ]);

        return successResponse(items, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user watchlist error:', error);
        return serverError();
    }
}
