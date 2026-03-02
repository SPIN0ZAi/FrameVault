import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

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
                _count: { select: { movies: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return successResponse(lists);
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

        const { title, description, isPublic } = await req.json();
        if (!title?.trim()) return serverError('Title is required');

        const list = await prisma.list.create({
            data: {
                userId: session.user.id,
                title: title.trim().slice(0, 200),
                description: description?.trim() || null,
                isPublic: isPublic !== false,
            },
        });

        return successResponse(list);
    } catch (error) {
        console.error('POST /api/lists error:', error);
        return serverError();
    }
}
