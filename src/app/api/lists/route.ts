import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';
import { checkAndAwardAchievements } from '@/lib/achievements';

// GET /api/lists — all public lists + current user's private lists
export async function GET() {
    try {
        const session = await auth();

        const lists = await prisma.list.findMany({
            where: session?.user
                ? { OR: [{ isPublic: true }, { userId: session.user.id }] }
                : { isPublic: true },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { movies: true, likes: true } },
                movies: {
                    where: { posterUrl: { not: null } },
                    orderBy: { position: 'asc' },
                    take: 5,
                    select: { posterUrl: true },
                },
            },
            orderBy: [{ isOfficial: 'desc' }, { isFeatured: 'desc' }, { updatedAt: 'desc' }],
        });

        const shaped = lists.map(({ movies, ...rest }) => ({
            ...rest,
            previewPosters: movies.map((m) => m.posterUrl as string),
        }));

        return successResponse(shaped);
    } catch (error) {
        console.error('GET /api/lists error:', error);
        return serverError();
    }
}

// POST /api/lists — create a new list
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { title, description, isPublic, isFeatured, isOfficial } = await req.json();
        if (!title?.trim()) return serverError('Title is required');

        const isAdmin = session.user.role === 'admin';

        const list = await prisma.list.create({
            data: {
                userId: session.user.id,
                title: title.trim().slice(0, 200),
                description: description?.trim() || null,
                isPublic: isPublic !== false,
                isFeatured: isAdmin ? Boolean(isFeatured) : false,
                isOfficial: isAdmin ? Boolean(isOfficial) : false,
            },
        });

        checkAndAwardAchievements(session.user.id).catch(() => null);

        return successResponse(list);
    } catch (error) {
        console.error('POST /api/lists error:', error);
        return serverError();
    }
}
