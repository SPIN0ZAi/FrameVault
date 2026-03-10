import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, serverError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') || 'films_alltime';

        const LIMIT = 20;

        // Helper to get avatar + username join
        const userSelect = {
            id: true,
            username: true,
            avatarUrl: true,
            profile: { select: { themeColor: true } },
        } as const;

        if (category === 'films_alltime') {
            const rows = await prisma.watchedMovie.groupBy({
                by: ['userId'],
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: LIMIT,
            });
            const users = await prisma.user.findMany({
                where: { id: { in: rows.map(r => r.userId) } },
                select: userSelect,
            });
            const userMap = new Map(users.map(u => [u.id, u]));
            return successResponse(rows.map(r => ({
                user: userMap.get(r.userId)!,
                value: r._count.userId,
                label: 'films watched',
            })).filter(r => r.user));
        }

        if (category === 'films_month') {
            const start = new Date();
            start.setDate(1); start.setHours(0, 0, 0, 0);
            const rows = await prisma.watchedMovie.groupBy({
                by: ['userId'],
                where: { watchedAt: { gte: start } },
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: LIMIT,
            });
            const users = await prisma.user.findMany({
                where: { id: { in: rows.map(r => r.userId) } },
                select: userSelect,
            });
            const userMap = new Map(users.map(u => [u.id, u]));
            return successResponse(rows.map(r => ({
                user: userMap.get(r.userId)!,
                value: r._count.userId,
                label: 'films this month',
            })).filter(r => r.user));
        }

        if (category === 'reviews') {
            const rows = await prisma.review.groupBy({
                by: ['userId'],
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: LIMIT,
            });
            const users = await prisma.user.findMany({
                where: { id: { in: rows.map(r => r.userId) } },
                select: userSelect,
            });
            const userMap = new Map(users.map(u => [u.id, u]));
            return successResponse(rows.map(r => ({
                user: userMap.get(r.userId)!,
                value: r._count.userId,
                label: 'reviews',
            })).filter(r => r.user));
        }

        if (category === 'avg_rating') {
            // Min 10 ratings to qualify
            const rows = await prisma.rating.groupBy({
                by: ['userId'],
                _avg: { value: true },
                _count: { userId: true },
                having: { userId: { _count: { gte: 10 } } },
                orderBy: { _avg: { value: 'desc' } },
                take: LIMIT,
            });
            const users = await prisma.user.findMany({
                where: { id: { in: rows.map(r => r.userId) } },
                select: userSelect,
            });
            const userMap = new Map(users.map(u => [u.id, u]));
            return successResponse(rows.map(r => ({
                user: userMap.get(r.userId)!,
                value: Math.round((r._avg.value ?? 0) * 10) / 10,
                label: `avg rating · ${r._count.userId} rated`,
            })).filter(r => r.user));
        }

        if (category === 'followers') {
            const rows = await prisma.follows.groupBy({
                by: ['followingId'],
                _count: { followingId: true },
                orderBy: { _count: { followingId: 'desc' } },
                take: LIMIT,
            });
            const users = await prisma.user.findMany({
                where: { id: { in: rows.map(r => r.followingId) } },
                select: userSelect,
            });
            const userMap = new Map(users.map(u => [u.id, u]));
            return successResponse(rows.map(r => ({
                user: userMap.get(r.followingId)!,
                value: r._count.followingId,
                label: 'followers',
            })).filter(r => r.user));
        }

        return successResponse([]);
    } catch (err) {
        console.error('[leaderboard] error:', err);
        return serverError();
    }
}
