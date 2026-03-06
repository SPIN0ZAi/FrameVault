import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username] — public profile
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
                profile: true,
                _count: {
                    select: {
                        watchedMovies: true,
                        watchlist: true,
                        reviews: true,
                        ratings: true,
                    },
                },
            },
        });

        if (!user) {
            return notFoundError('User');
        }

        // Calculate average rating and followers
        const [avgRating, followersCount, followingCount] = await Promise.all([
            prisma.rating.aggregate({
                where: { userId: user.id },
                _avg: { value: true },
            }),
            prisma.follows.count({ where: { followingId: user.id } }),
            prisma.follows.count({ where: { followerId: user.id } })
        ]);

        // Check if current user is following
        let isFollowing = false;
        const session = await auth();
        if (session?.user?.id) {
            const follow = await prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: session.user.id,
                        followingId: user.id,
                    }
                }
            });
            isFollowing = !!follow;
        }

        return successResponse({
            ...user,
            _count: {
                ...user._count,
                followers: followersCount,
                following: followingCount,
            },
            isFollowing,
            averageRating: avgRating._avg.value
                ? parseFloat(avgRating._avg.value.toFixed(1))
                : null,
        });
    } catch (error) {
        console.error('GET /api/users/[username] error:', error);
        return serverError();
    }
}
