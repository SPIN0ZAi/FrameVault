import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        const session = await auth();
        const currentUserId = session?.user?.id;

        const [followersRaw, followingRaw] = await Promise.all([
            prisma.follows.findMany({
                where: { followingId: user.id },
                include: {
                    follower: {
                        select: { id: true, username: true, avatarUrl: true, _count: { select: { watchedMovies: true } } },
                    },
                },
            }),
            prisma.follows.findMany({
                where: { followerId: user.id },
                include: {
                    following: {
                        select: { id: true, username: true, avatarUrl: true, _count: { select: { watchedMovies: true } } },
                    },
                },
            }),
        ]);

        // Attach isFollowing flag for current user
        let currentUserFollowingIds = new Set<string>();
        if (currentUserId) {
            const myFollows = await prisma.follows.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });
            currentUserFollowingIds = new Set(myFollows.map(f => f.followingId));
        }

        const followers = followersRaw.map(f => ({
            ...f.follower,
            isFollowing: currentUserFollowingIds.has(f.follower.id),
        }));

        const following = followingRaw.map(f => ({
            ...f.following,
            isFollowing: currentUserFollowingIds.has(f.following.id),
        }));

        return successResponse({ followers, following });
    } catch (error) {
        console.error('GET user network error:', error);
        return serverError();
    }
}
