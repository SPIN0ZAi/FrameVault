import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/members?sort=popular&page=1&q=search
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = 24;
        const skip = (page - 1) * limit;
        const sort = searchParams.get('sort') || 'popular'; // popular | newest | films
        const q = searchParams.get('q') || '';

        const where = q
            ? { username: { contains: q, mode: 'insensitive' as const } }
            : {};

        const orderBy =
            sort === 'newest'
                ? { createdAt: 'desc' as const }
                : sort === 'films'
                    ? { watchedMovies: { _count: 'desc' as const } }
                    : { followers: { _count: 'desc' as const } };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    createdAt: true,
                    profile: { select: { bio: true, themeColor: true } },
                    _count: {
                        select: {
                            watchedMovies: true,
                            reviews: true,
                            followers: true,
                            following: true,
                        },
                    },
                    // Recent watched posters for card preview
                    watchedMovies: {
                        take: 4,
                        orderBy: { watchedAt: 'desc' },
                        select: { movie: { select: { posterUrl: true, title: true } } },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        // If logged in, check follow status
        let followingIds = new Set<string>();
        if (session?.user?.id) {
            const follows = await prisma.follows.findMany({
                where: { followerId: session.user.id },
                select: { followingId: true },
            });
            followingIds = new Set(follows.map((f) => f.followingId));
        }

        const enriched = users.map((u) => ({
            ...u,
            isFollowing: followingIds.has(u.id),
        }));

        return successResponse(enriched, {
            page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
        });
    } catch (e) {
        console.error('GET /api/members error', e);
        return serverError();
    }
}
